import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import SiteContent from '@/models/SiteContent';
import { getSiteContent, saveSiteContent, DEFAULT_SITE_CONTENT } from '@/lib/content-store';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

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
      { success: false, error: error.message, content: DEFAULT_SITE_CONTENT },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    try {
      await connectToDatabase();
      let content = await SiteContent.findOne();
      if (!content) {
        content = new SiteContent(body);
      } else {
        Object.assign(content, body);
      }
      await content.save();

      // Also sync to local backup store
      saveSiteContent(body);

      return NextResponse.json(
        { success: true, message: 'Content & Form configuration saved successfully!', content },
        { headers: corsHeaders }
      );
    } catch {
      const updated = saveSiteContent(body);
      return NextResponse.json(
        { success: true, message: 'Configuration saved in local store (MongoDB offline)', content: updated },
        { headers: corsHeaders }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
