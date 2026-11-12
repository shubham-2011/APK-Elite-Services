import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession, unauthorizedResponse } from '@/lib/auth';
import { listUsers, createUser, updateUserPassword } from '@/lib/user-store';
import { getAdminCorsHeaders } from '@/lib/cors';
import { logAudit } from '@/lib/audit-logger';

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  return NextResponse.json({}, { headers: getAdminCorsHeaders(origin) });
}

// -------------------------------------------------------------
// GET /api/users - List CMS Users (Protected)
// -------------------------------------------------------------
export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin');
  const corsHeaders = getAdminCorsHeaders(origin);

  const auth = await verifyAdminSession(req);
  if (!auth.authenticated) {
    const status = auth.isCsrfError ? 403 : 401;
    return unauthorizedResponse(auth.error, status);
  }

  const users = await listUsers();
  return NextResponse.json({ success: true, users }, { headers: corsHeaders });
}

// -------------------------------------------------------------
// POST /api/users - Create New CMS User (Protected)
// -------------------------------------------------------------
export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  const corsHeaders = getAdminCorsHeaders(origin);

  const auth = await verifyAdminSession(req);
  if (!auth.authenticated) {
    const status = auth.isCsrfError ? 403 : 401;
    return unauthorizedResponse(auth.error, status);
  }

  const body = await req.json().catch(() => ({}));
  const { username, password, role } = body;

  const result = await createUser(username, password, role || 'admin');
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400, headers: corsHeaders }
    );
  }

  logAudit({
    action: 'CREATE_USER' as any,
    adminId: auth.username,
    success: true,
    details: { createdUser: result.user?.username, role: result.user?.role },
  });

  return NextResponse.json(
    { success: true, message: 'User created successfully', user: result.user },
    { status: 201, headers: corsHeaders }
  );
}

// -------------------------------------------------------------
// PATCH /api/users - Edit User Password (Protected)
// -------------------------------------------------------------
export async function PATCH(req: NextRequest) {
  const origin = req.headers.get('origin');
  const corsHeaders = getAdminCorsHeaders(origin);

  const auth = await verifyAdminSession(req);
  if (!auth.authenticated) {
    const status = auth.isCsrfError ? 403 : 401;
    return unauthorizedResponse(auth.error, status);
  }

  const body = await req.json().catch(() => ({}));
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json(
      { success: false, error: 'Username and new password are required' },
      { status: 400, headers: corsHeaders }
    );
  }

  const result = await updateUserPassword(username, password);
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400, headers: corsHeaders }
    );
  }

  logAudit({
    action: 'UPDATE_PASSWORD' as any,
    adminId: auth.username,
    success: true,
    details: { targetUser: username },
  });

  return NextResponse.json(
    { success: true, message: `Password for user ${username} updated successfully` },
    { headers: corsHeaders }
  );
}

