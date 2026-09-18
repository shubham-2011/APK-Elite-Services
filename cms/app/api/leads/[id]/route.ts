import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Lead from '@/models/Lead';
import { getFallbackLeads, updateFallbackLead, deleteFallbackLead } from '@/lib/fallback-store';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PATCH, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const lead = await Lead.findById(params.id);
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404, headers: corsHeaders });
    }
    return NextResponse.json({ success: true, lead }, { headers: corsHeaders });
  } catch {
    const leads = getFallbackLeads();
    const lead = leads.find((l) => l._id === params.id);
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404, headers: corsHeaders });
    }
    return NextResponse.json({ success: true, lead }, { headers: corsHeaders });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

    try {
      await connectToDatabase();
      const lead = await Lead.findById(params.id);
      if (!lead) {
        return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404, headers: corsHeaders });
      }

      if (body.status) lead.status = body.status;
      if (body.locality) lead.locality = body.locality;
      if (body.service) lead.service = body.service;
      if (body.propertyType) lead.propertyType = body.propertyType;
      if (body.note) {
        lead.notes.push({
          note: body.note.trim(),
          author: body.author || 'Admin',
          createdAt: new Date(),
        });
      }

      await lead.save();
      return NextResponse.json({ success: true, message: 'Lead updated', lead }, { headers: corsHeaders });
    } catch {
      const updated = updateFallbackLead(params.id, body);
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404, headers: corsHeaders });
      }
      return NextResponse.json({ success: true, message: 'Lead updated in local store', lead: updated }, { headers: corsHeaders });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    try {
      await connectToDatabase();
      const deleted = await Lead.findByIdAndDelete(params.id);
      if (!deleted) {
        return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404, headers: corsHeaders });
      }
      return NextResponse.json({ success: true, message: 'Lead deleted successfully' }, { headers: corsHeaders });
    } catch {
      const deleted = deleteFallbackLead(params.id);
      if (!deleted) {
        return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404, headers: corsHeaders });
      }
      return NextResponse.json({ success: true, message: 'Lead deleted from local store' }, { headers: corsHeaders });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
  }
}
