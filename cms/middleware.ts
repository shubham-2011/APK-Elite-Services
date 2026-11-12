import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'apk_cms_session';
const AUTH_SECRET = process.env.AUTH_SECRET || 'fallback-secret-key-change-in-production-min-32-chars';

/**
 * Edge-compatible cryptographic token verification for HMAC-SHA256 session tokens.
 * Verifies signature and expiration timestamp.
 */
async function verifyTokenInMiddleware(token: string): Promise<boolean> {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, signatureB64] = parts;

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(AUTH_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBuf = Buffer.from(signatureB64, 'base64url');
    const dataBuf = new TextEncoder().encode(payloadB64);

    const isValidSig = await crypto.subtle.verify('HMAC', key, sigBuf, dataBuf);
    if (!isValidSig) return false;

    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadJson);
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // 1. Static and internal Next.js assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.webp')
  ) {
    return NextResponse.next();
  }

  // 2. Publicly accessible authentication routes
  if (
    pathname === '/login' ||
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/logout' ||
    pathname === '/api/auth/me'
  ) {
    return NextResponse.next();
  }

  // 3. Public website API endpoints (e.g. quote submission from frontend)
  // Public users can submit leads, record footmarks, and fetch public site content
  if (
    (pathname === '/api/leads' && method === 'POST') ||
    (pathname === '/api/footmark' && method === 'POST') ||
    (pathname === '/api/content' && method === 'GET')
  ) {
    return NextResponse.next();
  }

  // Pass OPTIONS preflights to route handlers
  if (method === 'OPTIONS') {
    return NextResponse.next();
  }

  // 4. Check for session cookie or Bearer token
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;

  const token = sessionCookie || bearerToken;

  // Cryptographically verify token validity & expiration
  const isValid = token ? await verifyTokenInMiddleware(token) : false;

  // If unauthenticated or token is invalid/tampered/expired:
  if (!isValid) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Admin authentication required',
        },
        { status: 401 }
      );
    }

    // Redirect browser to login page
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
