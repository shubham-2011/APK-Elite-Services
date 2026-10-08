import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import Lead from '@/models/Lead';
import { getFallbackLeads, updateFallbackLead, deleteFallbackLead } from '@/lib/fallback-store';
import { verifyAdminSession, unauthorizedResponse } from '@/lib/auth';
import { isValidId, sanitizeString } from '@/lib/security';
import { LeadUpdateSchema } from '@/lib/validation';
import { logAudit } from '@/lib/audit-logger';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PATCH, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// -------------------------------------------------------------
// GET /api/leads/[id] - Fetch single lead
// -------------------------------------------------------------
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await verifyAdminSession(req);
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error);
  }

  const { id } = params;
  if (!isValidId(id)) {
    return NextResponse.json(
      { success: false, error: 'Invalid lead ID format' },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    await connectToDatabase();
    if (mongoose.Types.ObjectId.isValid(id)) {
      const lead = await Lead.findById(id).lean();
      if (!lead) {
        return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404, headers: corsHeaders });
      }
      return NextResponse.json({ success: true, lead }, { headers: corsHeaders });
    }
  } catch (mongoErr) {
    console.warn('MongoDB lookup failed, trying fallback store:', mongoErr);
  }

  // Fallback store check
  const leads = getFallbackLeads();
  const lead = leads.find((l) => l._id === id);
  if (!lead) {
    return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404, headers: corsHeaders });
  }

  return NextResponse.json({ success: true, lead }, { headers: corsHeaders });
}

// -------------------------------------------------------------
// PATCH /api/leads/[id] - Update status, locality, note
// -------------------------------------------------------------
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await verifyAdminSession(req);
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error);
  }

  const { id } = params;
  if (!isValidId(id)) {
    return NextResponse.json(
      { success: false, error: 'Invalid lead ID format' },
      { status: 400, headers: corsHeaders }
    );
  }

  const rawBody = await req.json().catch(() => ({}));
  const validation = LeadUpdateSchema.safeParse(rawBody);

  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid update payload', details: validation.error.flatten() },
      { status: 400, headers: corsHeaders }
    );
  }

  const body = validation.data;

  try {
    await connectToDatabase();
    if (mongoose.Types.ObjectId.isValid(id)) {
      const lead = await Lead.findById(id);
      if (!lead) {
        return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404, headers: corsHeaders });
      }

      if (body.status) lead.status = body.status;
      if (body.locality) lead.locality = sanitizeString(body.locality, 80);
      if (body.service) lead.service = sanitizeString(body.service, 80);
      if (body.propertyType) lead.propertyType = sanitizeString(body.propertyType, 50);
      if (body.note) {
        lead.notes.push({
          note: sanitizeString(body.note, 1000),
          author: sanitizeString(body.author || auth.username || 'Admin', 50),
          createdAt: new Date(),
        });
      }

      await lead.save();
      return NextResponse.json({ success: true, message: 'Lead updated successfully', lead }, { headers: corsHeaders });
    }
  } catch (mongoErr) {
    console.warn('MongoDB update failed, saving in local fallback store:', mongoErr);
  }

  // Fallback store update
  const updated = updateFallbackLead(id, {
    ...body,
    author: auth.username || 'Admin',
  });

  if (!updated) {
    return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404, headers: corsHeaders });
  }

  return NextResponse.json(
    { success: true, message: 'Lead updated in local store', lead: updated },
    { headers: corsHeaders }
  );
}

// -------------------------------------------------------------
// DELETE /api/leads/[id] - Authorized Lead Deletion
// -------------------------------------------------------------
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  // 1. Authentication check
  const auth = await verifyAdminSession(req);
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error);
  }

  const { id } = params;

  // 2. Validate ID format
  if (!isValidId(id)) {
    return NextResponse.json(
      { success: false, error: 'Invalid lead ID format' },
      { status: 400, headers: corsHeaders }
    );
  }

  // 3. Attempt DB deletion
  let deletedFromMongo = false;
  try {
    await connectToDatabase();
    if (mongoose.Types.ObjectId.isValid(id)) {
      const deleted = await Lead.findByIdAndDelete(id);
      if (deleted) {
        deletedFromMongo = true;
      }
    }
  } catch (mongoErr) {
    console.warn('MongoDB delete failed or offline:', mongoErr);
  }

  // 4. Also check/delete from fallback local store
  const deletedFromLocal = deleteFallbackLead(id);

  if (!deletedFromMongo && !deletedFromLocal) {
    return NextResponse.json(
      { success: false, error: 'Lead not found or already deleted' },
      { status: 404, headers: corsHeaders }
    );
  }

  // 5. Audit log the deletion
  logAudit({
    action: 'DELETE_LEAD',
    adminId: auth.username,
    resource: `/api/leads/${id}`,
    success: true,
    details: { leadId: id, source: deletedFromMongo ? 'mongodb' : 'local_store' },
  });

  return NextResponse.json(
    { success: true, message: 'Lead deleted successfully' },
    { headers: corsHeaders }
  );
}
