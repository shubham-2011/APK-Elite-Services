import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { logAudit } from './audit-logger';
import { isSessionRevoked, revokeSession } from './session-revocation';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from './persistent-rate-limiter';

export const SESSION_COOKIE_NAME = 'apk_cms_session';
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

// Server-side only secrets (never exposed to browser)
const AUTH_SECRET = process.env.AUTH_SECRET || 'fallback-secret-key-change-in-production-min-32-chars';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
// This fallback hash is for 'CHANGE_ME_IN_ENV' — it will NEVER authenticate successfully.
// Always set ADMIN_PASSWORD_HASH in your .env.local / environment variables.
const ADMIN_PASSWORD_HASH =
  process.env.ADMIN_PASSWORD_HASH ||
  '$2b$10$PLACEHOLDER000000000000000000000000000000000000000000000';

// Production safety verification
if (process.env.NODE_ENV === 'production') {
  if (AUTH_SECRET === 'fallback-secret-key-change-in-production-min-32-chars') {
    console.error('FATAL SECURITY WARNING: Default AUTH_SECRET used in production! Set AUTH_SECRET in environment.');
  }
  if (!process.env.ADMIN_PASSWORD_HASH) {
    console.error('FATAL SECURITY WARNING: ADMIN_PASSWORD_HASH not set in environment! Admin login will fail.');
  }
}

/**
 * Creates a cryptographically signed revocable session token:
 * format: <base64url(payload)>.<signature>
 */
export function createSessionToken(username: string): { token: string; sessionId: string; expiresAt: number } {
  const sessionId = crypto.randomUUID();
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;

  const payload = {
    sid: sessionId,
    username,
    role: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: expiresAt,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(payloadB64)
    .digest('base64url');

  return {
    token: `${payloadB64}.${signature}`,
    sessionId,
    expiresAt,
  };
}

/**
 * Verifies the cryptographically signed session token.
 */
export function verifySessionToken(token: string): {
  valid: boolean;
  username?: string;
  sessionId?: string;
  exp?: number;
  error?: string;
} {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'No token provided' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Malformed token' };
  }

  const [payloadB64, signature] = parts;

  // Verify HMAC signature using timing-safe comparison
  const expectedSignature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(payloadB64)
    .digest('base64url');

  if (
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return { valid: false, error: 'Invalid token signature' };
  }

  try {
    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadJson);

    // Verify expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Token expired' };
    }

    return {
      valid: true,
      username: payload.username,
      sessionId: payload.sid,
      exp: payload.exp,
    };
  } catch {
    return { valid: false, error: 'Invalid token payload' };
  }
}

/**
 * Authenticates user credentials against the configured password hash.
 */
export async function authenticateCredentials(
  usernameInput: string,
  passwordInput: string
): Promise<{ success: boolean; username?: string }> {
  if (!usernameInput || !passwordInput) {
    return { success: false };
  }

  const isUsernameMatch = usernameInput.trim().toLowerCase() === ADMIN_USERNAME.toLowerCase();
  if (!isUsernameMatch) {
    return { success: false };
  }

  const isPasswordMatch = await bcrypt.compare(passwordInput, ADMIN_PASSWORD_HASH);
  if (!isPasswordMatch) {
    return { success: false };
  }

  return { success: true, username: ADMIN_USERNAME };
}

/**
 * Checks CSRF protection for cookie-authenticated mutating requests.
 */
function verifyCsrfSafety(req: NextRequest | Request, isCookieAuth: boolean): boolean {
  // If authenticated via Bearer token (non-cookie), CSRF is not applicable
  if (!isCookieAuth) {
    return true;
  }

  const method = req.method.toUpperCase();
  // Safe idempotent read methods
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return true;
  }

  // 1. Check custom header (browsers block cross-origin custom headers without CORS preflight approval)
  const customHeader = req.headers.get('x-requested-with') || req.headers.get('x-csrf-token');
  if (customHeader) {
    return true;
  }

  // 2. Check Origin or Referer header against host
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const host = req.headers.get('host');

  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) return true;
    } catch {}
  }

  if (referer && host) {
    try {
      const refererHost = new URL(referer).host;
      if (refererHost === host) return true;
    } catch {}
  }

  // If no origin/referer and no custom header on a mutating cookie request:
  // Allow if Content-Type is application/json (browsers disallow simple cross-site JSON fetch without preflight)
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return true;
  }

  return false;
}

/**
 * Core server-side authorization guard.
 * Call this in any API route to verify the requester is an authorized admin.
 * Verifies:
 * 1. Token signature & expiration
 * 2. Server-side revocation status (logout blacklist)
 * 3. CSRF origin verification on state-changing requests
 */
export async function verifyAdminSession(
  req: NextRequest | Request
): Promise<{ authenticated: boolean; username?: string; sessionId?: string; error?: string }> {
  let token: string | undefined;
  let isCookieAuth = false;

  // 1. Try Authorization header (Bearer token)
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // 2. Try cookie
  if (!token && 'cookies' in req && typeof (req as NextRequest).cookies?.get === 'function') {
    token = (req as NextRequest).cookies.get(SESSION_COOKIE_NAME)?.value;
    if (token) isCookieAuth = true;
  }

  // 3. Fallback cookie parsing if plain Request
  if (!token) {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]*)`));
    if (match) {
      token = decodeURIComponent(match[1]);
      isCookieAuth = true;
    }
  }

  if (!token) {
    logAudit({
      action: 'UNAUTHORIZED_ACCESS',
      resource: req.url,
      success: false,
      details: { reason: 'Missing credentials' },
    });
    return { authenticated: false, error: 'Unauthorized: Session missing' };
  }

  // 4. Verify token cryptographic signature
  const verification = verifySessionToken(token);
  if (!verification.valid) {
    logAudit({
      action: 'UNAUTHORIZED_ACCESS',
      resource: req.url,
      success: false,
      details: { reason: verification.error },
    });
    return { authenticated: false, error: `Unauthorized: ${verification.error}` };
  }

  // 5. Server-side Revocation Check (Ensures logout REALLY invalidates the token)
  if (verification.sessionId) {
    const isRevoked = await isSessionRevoked(verification.sessionId);
    if (isRevoked) {
      logAudit({
        action: 'UNAUTHORIZED_ACCESS',
        resource: req.url,
        adminId: verification.username,
        success: false,
        details: { reason: 'Session has been revoked (logged out)' },
      });
      return { authenticated: false, error: 'Unauthorized: Session has been revoked. Please log in again.' };
    }
  }

  // 6. CSRF Protection Check
  if (!verifyCsrfSafety(req, isCookieAuth)) {
    logAudit({
      action: 'UNAUTHORIZED_ACCESS',
      resource: req.url,
      adminId: verification.username,
      success: false,
      details: { reason: 'CSRF verification failure' },
    });
    return { authenticated: false, error: 'Forbidden: CSRF check failed' };
  }

  return { authenticated: true, username: verification.username, sessionId: verification.sessionId };
}

/**
 * Helper to build an unauthorized 401 response.
 */
export function unauthorizedResponse(message = 'Unauthorized: Admin authentication required'): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

// Re-export rate limiting helpers
export { checkRateLimit, recordFailedAttempt, resetRateLimit, revokeSession, isSessionRevoked };
