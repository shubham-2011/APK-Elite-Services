import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Lead from '@/models/Lead';
import { getFallbackLeads, saveFallbackLead } from '@/lib/fallback-store';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PATCH, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, service, locality, propertyType, message, source } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: 'Name and Phone number are required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Try MongoDB first
    try {
      await connectToDatabase();
      const newLead = await Lead.create({
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : undefined,
        service: service || 'Deep Cleaning',
        locality: locality || 'Pune',
        propertyType: propertyType || 'Residential',
        message: message ? message.trim() : '',
        source: source || 'quote_modal',
        status: 'NEW',
        notes: [
          {
            note: `Lead submitted via ${source || 'Website'}`,
            author: 'System',
            createdAt: new Date(),
          },
        ],
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Lead captured successfully in MongoDB!',
          leadId: newLead._id,
        },
        { status: 201, headers: corsHeaders }
      );
    } catch (mongoErr: any) {
      console.warn('MongoDB connection failed; saving to fallback JSON store:', mongoErr.message);
      const fallbackLead = saveFallbackLead({
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : undefined,
        service: service || 'Deep Cleaning',
        locality: locality || 'Pune',
        propertyType: propertyType || 'Residential',
        message: message ? message.trim() : '',
        source: source || 'quote_modal',
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Lead captured successfully (local store)!',
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
        error: error.message || 'Failed to save lead in database.',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const service = searchParams.get('service') || '';
  const locality = searchParams.get('locality') || '';

  try {
    await connectToDatabase();

    const query: Record<string, any> = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (service && service !== 'ALL') {
      query.service = { $regex: new RegExp(service, 'i') };
    }

    if (locality && locality !== 'ALL') {
      query.locality = { $regex: new RegExp(locality, 'i') };
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
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
      .limit(100)
      .lean();

    return NextResponse.json(
      {
        success: true,
        total,
        leads,
      },
      { headers: corsHeaders }
    );
  } catch (mongoErr: any) {
    // Fallback to local store
    const allLeads = getFallbackLeads();
    const filtered = allLeads.filter((l) => {
      if (status && status !== 'ALL' && l.status !== status) return false;
      if (locality && locality !== 'ALL' && !l.locality?.toLowerCase().includes(locality.toLowerCase())) return false;
      if (service && service !== 'ALL' && !l.service?.toLowerCase().includes(service.toLowerCase())) return false;
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

    return NextResponse.json(
      {
        success: true,
        total: filtered.length,
        leads: filtered,
        source: 'local_store',
      },
      { headers: corsHeaders }
    );
  }
}
