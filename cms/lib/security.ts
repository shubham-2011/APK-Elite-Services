/**
 * Security and Sanitization Utilities
 */

/**
 * Escapes all regular expression special characters in user input
 * to prevent Regular Expression Denial of Service (ReDoS) and regex syntax crashes.
 */
export function escapeRegex(value: string): string {
  if (!value || typeof value !== 'string') return '';
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitizes and trims user string input, enforcing an optional maximum length.
 */
export function sanitizeString(value: unknown, maxLength = 255): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

/**
 * Validates whether a given string is a valid 24-character hexadecimal MongoDB ObjectId
 * or an acceptable local store ID format.
 */
export function isValidId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  // MongoDB 24-char hex format
  const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
  // Local fallback ID format: e.g. lead_123456789_abc1
  const localIdRegex = /^[a-zA-Z0-9_-]{5,64}$/;
  return mongoIdRegex.test(id) || localIdRegex.test(id);
}
