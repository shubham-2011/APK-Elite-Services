/**
 * CORS Headers Helper
 *
 * - getAdminCorsHeaders: Scoped to allowed Angular frontend origins only.
 *   Used on all protected admin API routes (stats, leads GET, footmark GET, content PUT).
 * - publicCorsHeaders: Wide-open for public beacon/content routes callable from
 *   the Angular SSR server and any browser visiting the public site.
 */

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:4200')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

export function getAdminCorsHeaders(requestOrigin?: string | null): Record<string, string> {
  const origin =
    requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)
      ? requestOrigin
      : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };
}

export const publicCorsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
