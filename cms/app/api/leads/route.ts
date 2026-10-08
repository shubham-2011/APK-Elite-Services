import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Lead from '@/models/Lead';
import { getFallbackLeads, saveFallbackLead } from '@/lib/fallback-store';
import { verifyAdminSession, unauthorizedResponse } from '@/lib/auth';
import { escapeRegex, sanitizeString } from '@/lib/security';
import { logAudit } from '@/lib/audit-logger';
import { getAdminCorsHeaders, publicCorsHeaders } from '@/lib/cors';

export async function OPTIONS() {
  return NextResponse.json({}, { headers: publicCorsHeaders });
}

// CORS headers for public lead submission endpoint
const corsHeaders = publicCorsHeaders;

// -------------------------------------------------------------
// POST /api/leads - Public Lead Capture from Web & Quote Form
// -------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, phone, email, service, locality, propertyType, message, source } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Customer name is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return NextResponse.json(
        { success: false, error: 'Valid phone number is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Sanitize input values with bounded lengths
    const cleanLead = {
      name: sanitizeString(name, 100),
      phone: sanitizeString(phone, 25),
      email: email && typeof email === 'string' ? sanitizeString(email, 100).toLowerCase() : undefined,
      service: sanitizeString(service || 'Deep Cleaning', 80),
      locality: sanitizeString(locality || 'Pune', 80),
      propertyType: sanitizeString(propertyType || 'Residential', 50),
      message: sanitizeString(message || '', 1000),
      source: sanitizeString(source || 'quote_modal', 50),
    };

    // 1. Try saving to MongoDB
    try {
      await connectToDatabase();
      const newLead = await Lead.create({
        ...cleanLead,
        status: 'NEW',
        notes: [
          {
            note: `Lead submitted via ${cleanLead.source}`,
            author: 'System',
            createdAt: new Date(),
          },
        ],
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Lead captured successfully in database',
          leadId: newLead._id,
        },
        { status: 201, headers: corsHeaders }
      );
    } catch (mongoErr: any) {
      console.warn('MongoDB connection failed; saving to fallback JSON store:', mongoErr.message);
      const fallbackLead = saveFallbackLead(cleanLead);

      return NextResponse.json(
        {
          success: true,
          message: 'Lead captured successfully (local store)',
          leadId: fallbackLead._id,
          notice: 'Stored in local backup store (MongoDB connection pending)',
        },
        { status: 201, headers: corsHeaders }
      );
    }
  } catch (error: any) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process lead submission',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// -------------------------------------------------------------
// GET /api/leads - Protected Admin Lead Explorer
// -------------------------------------------------------------
export async function GET(req: NextRequest) {
  // 1. Enforce Server-Side Authentication
  const auth = await verifyAdminSession(req);
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error || 'Authentication required to access customer leads');
  }
  const corsHeaders = getAdminCorsHeaders(req.headers.get('origin'));

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const service = searchParams.get('service') || '';
  const locality = searchParams.get('locality') || '';

  // 2. Validate search parameter length to prevent abuse / ReDoS
  if (search.length > 100) {
    return NextResponse.json(
      { success: false, error: 'Search query exceeds maximum limit of 100 characters' },
      { status: 400, headers: corsHeaders }
    );
  }

  // 3. Pagination controls with enforced maximum limit
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const limitParam = parseInt(searchParams.get('limit') || '50', 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const limit = isNaN(limitParam) || limitParam < 1 ? 50 : Math.min(limitParam, 100);
  const skip = (page - 1) * limit;

  // 4. Safe Regular Expression construction (Escaping user input)
  const safeSearch = escapeRegex(search.trim());
  const safeService = escapeRegex(service.trim());
  const safeLocality = escapeRegex(locality.trim());

  logAudit({
    action: 'VIEW_LEADS',
    adminId: auth.username,
    success: true,
    details: { search, status, service, locality, page, limit },
  });

  try {
    await connectToDatabase();

    const query: Record<string, any> = {};

    if (status && status !== 'ALL') {
      const allowedStatuses = ['NEW', 'CONTACTED', 'QUOTE_SENT', 'CONFIRMED', 'COMPLETED', 'LOST'];
      if (allowedStatuses.includes(status)) {
        query.status = status;
      }
    }

    if (safeService && safeService !== 'ALL' && safeService !== 'All') {
      query.service = { $regex: new RegExp(safeService, 'i') };
    }

    if (safeLocality && safeLocality !== 'ALL' && safeLocality !== 'All') {
      query.locality = { $regex: new RegExp(safeLocality, 'i') };
    }

    if (safeSearch) {
      const searchRegex = new RegExp(safeSearch, 'i');
      query.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
        { message: searchRegex },
      ];
    }

    const total = await Lead.countDocuments(query);
    const leads = await Lead.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json(
      {
        success: true,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        leads,
      },
      { headers: corsHeaders }
    );
  } catch (mongoErr: any) {
    console.warn('MongoDB query failed, falling back to local store:', mongoErr.message);

    // Fallback to local store with safe filtering
    const allLeads = getFallbackLeads();
    const filtered = allLeads.filter((l) => {
      if (status && status !== 'ALL' && l.status !== status) return false;
      if (locality && locality !== 'ALL' && locality !== 'All') {
        if (!l.locality?.toLowerCase().includes(locality.toLowerCase())) return false;
      }
      if (service && service !== 'ALL' && service !== 'All') {
        if (!l.service?.toLowerCase().includes(service.toLowerCase())) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return (
          l.name.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          (l.email && l.email.toLowerCase().includes(q)) ||
          (l.message && l.message.toLowerCase().includes(q))
        );
      }
      return true;
    });

    const paginatedLeads = filtered.slice(skip, skip + limit);

    return NextResponse.json(
      {
        success: true,
        total: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit),
        leads: paginatedLeads,
        source: 'local_store',
      },
      { headers: corsHeaders }
    );
  }
}
