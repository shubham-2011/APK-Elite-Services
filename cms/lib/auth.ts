import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { logAudit } from './audit-logger';
import { isSessionRevoked, revokeSession } from './session-revocation';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from './persistent-rate-limiter';
import { findUserByUsername } from './user-store';

export const SESSION_COOKIE_NAME = 'apk_cms_session';
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  return typeof secret === 'string' && secret.length >= 32 ? secret : '';
}

export function isAuthConfigured(): boolean {
  return Boolean(getAuthSecret());
}

/**
 * Creates a cryptographically signed revocable session token:
 * format: <base64url(payload)>.<signature>
 */
export function createSessionToken(
  username: string,
  role: 'admin' | 'editor' = 'admin'
): { token: string; sessionId: string; expiresAt: number } {
  const secret = getAuthSecret();
  if (!secret) throw new Error('AUTH_SECRET must contain at least 32 characters');

  const sessionId = crypto.randomUUID();
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;

  const payload = {
    sid: sessionId,
    username,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: expiresAt,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
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
  role?: 'admin' | 'editor';
  sessionId?: string;
  exp?: number;
  error?: string;
} {
  const secret = getAuthSecret();
  if (!secret) return { valid: false, error: 'Authentication is not configured' };
  if (!token || typeof token !== 'string' || token.length > 4096) {
    return { valid: false, error: 'No token provided' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Malformed token' };
  }

  const [payloadB64, signature] = parts;

  // Verify HMAC signature using timing-safe comparison
  const expectedSignature = crypto
    .createHmac('sha256', secret)
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
    if (
      typeof payload.username !== 'string' ||
      !payload.username ||
      typeof payload.sid !== 'string' ||
      !payload.sid ||
      !Number.isInteger(payload.exp) ||
      payload.exp <= now ||
      !['admin', 'editor'].includes(payload.role)
    ) {
      return { valid: false, error: 'Token expired' };
    }

    return {
      valid: true,
      username: payload.username,
      role: payload.role,
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
): Promise<{ success: boolean; username?: string; role?: 'admin' | 'editor' }> {
  if (!usernameInput || !passwordInput) {
    return { success: false };
  }

  const cleanUsername = usernameInput.trim().toLowerCase();

  // 1. Check registered CMS users in database / user store.
  const storedUser = await findUserByUsername(cleanUsername);
  if (storedUser && storedUser.passwordHash) {
    const isUserPasswordMatch = await bcrypt.compare(passwordInput, storedUser.passwordHash);
    if (isUserPasswordMatch) {
      return { success: true, username: storedUser.username, role: storedUser.role };
    }
  }

  // 2. Check primary environment admin credentials fallback
  const currentAdminUser = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
  const currentAdminHash = process.env.ADMIN_PASSWORD_HASH || '';
  if (cleanUsername === currentAdminUser && currentAdminHash) {
    const isPasswordMatch = await bcrypt.compare(passwordInput, currentAdminHash);
    if (isPasswordMatch) {
      return { success: true, username: currentAdminUser, role: 'admin' };
    }
  }

  return { success: false };
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

  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const host = req.headers.get('host');

  // 2. Check Origin header against host
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (host && originHost === host) return true;
      // Cross-origin request detected!
      return false;
    } catch {
      return false;
    }
  }

  // 3. Check Referer header against host
  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      if (host && refererHost === host) return true;
      // Cross-origin referer detected!
      return false;
    } catch {
      return false;
    }
  }

  // If no custom header and no origin/referer on cookie-authenticated mutating request, reject
  return false;
}

export interface AuthVerificationResult {
  authenticated: boolean;
  username?: string;
  role?: 'admin' | 'editor';
  sessionId?: string;
  error?: string;
  isCsrfError?: boolean;
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
): Promise<AuthVerificationResult> {
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

  if (verification.role !== 'admin') {
    return { authenticated: false, error: 'Unauthorized: Administrator role required' };
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
    return { authenticated: false, isCsrfError: true, error: 'Forbidden: CSRF check failed' };
  }

  return {
    authenticated: true,
    username: verification.username,
    role: verification.role,
    sessionId: verification.sessionId
  };
}

/**
 * Helper to build an unauthorized 401/403 response.
 */
export function unauthorizedResponse(
  message = 'Unauthorized: Admin authentication required',
  status = 401
): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status });
}

// Re-export rate limiting helpers
export { checkRateLimit, recordFailedAttempt, resetRateLimit, revokeSession, isSessionRevoked };
