import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import SiteContent from '@/models/SiteContent';
import { getSiteContent, saveSiteContent, DEFAULT_SITE_CONTENT } from '@/lib/content-store';
import { verifyAdminSession, unauthorizedResponse } from '@/lib/auth';
import { SiteContentSchema } from '@/lib/validation';
import { logAudit } from '@/lib/audit-logger';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// -------------------------------------------------------------
// GET /api/content - Public website content reader
// -------------------------------------------------------------
export async function GET() {
  try {
    try {
      await connectToDatabase();
      let content = await SiteContent.findOne();
      if (!content) {
        content = await SiteContent.create(DEFAULT_SITE_CONTENT);
      }
      return NextResponse.json({ success: true, content }, { headers: corsHeaders });
    } catch {
      const content = getSiteContent();
      return NextResponse.json({ success: true, content, source: 'local_store' }, { headers: corsHeaders });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve site content', content: DEFAULT_SITE_CONTENT },
      { status: 500, headers: corsHeaders }
    );
  }
}

// -------------------------------------------------------------
// PUT /api/content - Protected Admin Content Management
// -------------------------------------------------------------
export async function PUT(req: NextRequest) {
  // 1. Enforce Server-Side Authentication
  const auth = await verifyAdminSession(req);
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error || 'Authentication required to modify site configuration');
  }

  try {
    const rawBody = await req.json().catch(() => ({}));

    // Support both { content: { ... } } wrapper and direct payload
    const payload = rawBody.content || rawBody;

    // 2. Strict Schema Validation (Disallowing arbitrary keys)
    const validation = SiteContentSchema.safeParse(payload);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid content schema',
          issues: validation.error.flatten(),
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const validatedData = validation.data;

    // 3. Persist to MongoDB
    try {
      await connectToDatabase();
      let content = await SiteContent.findOne();
      if (!content) {
        content = new SiteContent(validatedData);
      } else {
        // Safe update with only validated schema fields
        Object.assign(content, validatedData);
      }
      await content.save();

      // Sync to local backup store
      saveSiteContent(validatedData as any);

      logAudit({
        action: 'UPDATE_CONTENT',
        adminId: auth.username,
        success: true,
      });

      return NextResponse.json(
        { success: true, message: 'Content & Form configuration saved successfully', content },
        { headers: corsHeaders }
      );
    } catch (dbErr: any) {
      console.warn('MongoDB offline, persisting to local store:', dbErr.message);
      const updated = saveSiteContent(validatedData as any);

      logAudit({
        action: 'UPDATE_CONTENT',
        adminId: auth.username,
        success: true,
        details: { target: 'local_store' },
      });

      return NextResponse.json(
        { success: true, message: 'Configuration saved in local store (MongoDB offline)', content: updated },
        { headers: corsHeaders }
      );
    }
  } catch (error: any) {
    console.error('Error saving site content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update site configuration' },
      { status: 500, headers: corsHeaders }
    );
  }
}
