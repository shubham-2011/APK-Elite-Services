import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateCredentials,
  createSessionToken,
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
} from '@/lib/auth';
import { logAudit } from '@/lib/audit-logger';
import { getAdminCorsHeaders } from '@/lib/cors';

export async function POST(req: NextRequest) {
  try {
    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    // 1. Persistent, multi-instance rate limiting check — keyed by IP AND username
    const rateLimit = await checkRateLimit(clientIp);
    if (!rateLimit.allowed) {
      logAudit({
        action: 'LOGIN_FAILURE',
        ip: clientIp,
        success: false,
        details: { reason: 'Rate limited', retryAfter: rateLimit.retryAfterSeconds },
      });
      return NextResponse.json(
        {
          success: false,
          error: `Too many failed login attempts. Please try again in ${Math.ceil(
            rateLimit.retryAfterSeconds / 60
          )} minutes.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { username, password } = body;

    // Strict server-side validation — blocks empty, whitespace-only, and too-short inputs
    const usernameClean = typeof username === 'string' ? username.trim() : '';
    const passwordClean = typeof password === 'string' ? password : '';

    if (!usernameClean || !passwordClean) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (usernameClean.length < 2 || usernameClean.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (passwordClean.length < 6 || passwordClean.length > 200) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // 2a. Per-username rate limiting (defends against distributed IP attacks)
    const userRateLimit = await checkRateLimit(`user:${usernameClean.toLowerCase()}`);
    if (!userRateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Account temporarily locked. Please try again later.' },
        { status: 429 }
      );
    }

    // 2b. Authenticate credentials with bcrypt
    const authResult = await authenticateCredentials(usernameClean, passwordClean);

    if (!authResult.success) {
      await recordFailedAttempt(clientIp);
      await recordFailedAttempt(`user:${usernameClean.toLowerCase()}`);
      logAudit({
        action: 'LOGIN_FAILURE',
        adminId: usernameClean,
        ip: clientIp,
        success: false,
        details: { reason: 'Invalid credentials' },
      });
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // 3. Clear failed login attempts upon success (both IP and username keys)
    await resetRateLimit(clientIp);
    await resetRateLimit(`user:${usernameClean.toLowerCase()}`);

    // 4. Create cryptographically signed revocable session token
    const { token, sessionId, expiresAt } = createSessionToken(authResult.username || 'admin');

    logAudit({
      action: 'LOGIN_SUCCESS',
      adminId: authResult.username,
      ip: clientIp,
      success: true,
      details: { sessionId },
    });

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: { username: authResult.username },
      token,
      expiresAt,
    });

    // 5. Store session in secure HTTP-only strict-same-site cookie
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_DURATION_SECONDS,
      path: '/',
    });

    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal authentication error' },
      { status: 500 }
    );
  }
}
