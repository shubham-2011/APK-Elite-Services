import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken, revokeSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit-logger';

export async function POST(req: NextRequest) {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

  // 1. Extract token to invalidate server-side
  let token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  // 2. Perform genuine server-side session revocation
  if (token) {
    const verified = verifySessionToken(token);
    if (verified.valid && verified.sessionId) {
      await revokeSession(
        verified.sessionId,
        verified.username || 'admin',
        verified.exp || Math.floor(Date.now() / 1000) + 7 * 86400
      );
    }
  }

  logAudit({
    action: 'LOGOUT',
    ip: clientIp,
    success: true,
  });

  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully and session revoked',
  });

  // 3. Clear session cookie in browser
  response.cookies.delete(SESSION_COOKIE_NAME);

  return response;
}
