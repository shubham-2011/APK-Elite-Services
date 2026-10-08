import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await verifyAdminSession(req);

  if (!auth.authenticated) {
    return NextResponse.json(
      { authenticated: false, error: auth.error || 'Not authenticated' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    user: { username: auth.username, role: 'admin' },
  });
}
