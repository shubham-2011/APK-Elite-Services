/**
 * Audit Logger for Administrative Operations
 * Records security-sensitive operations without logging secrets or unnecessary PII.
 */

export type AuditAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'VIEW_LEADS'
  | 'UPDATE_CONTENT'
  | 'DELETE_LEAD'
  | 'UNAUTHORIZED_ACCESS';

export interface AuditEntry {
  timestamp: string;
  action: AuditAction;
  adminId?: string;
  ip?: string;
  resource?: string;
  success: boolean;
  details?: Record<string, unknown>;
}

// In-memory buffer for recent audit events (capped at 500)
const auditBuffer: AuditEntry[] = [];

export function logAudit(entry: Omit<AuditEntry, 'timestamp'>): void {
  const fullEntry: AuditEntry = {
    timestamp: new Date().toISOString(),
    ...entry,
  };

  // Add to buffer
  auditBuffer.unshift(fullEntry);
  if (auditBuffer.length > 500) {
    auditBuffer.pop();
  }

  // Structured console log for container / server log collectors
  const statusStr = entry.success ? 'SUCCESS' : 'FAILED';
  const adminStr = entry.adminId ? `[Admin: ${entry.adminId}]` : '[Anon]';
  const ipStr = entry.ip ? `[IP: ${entry.ip}]` : '';
  const resStr = entry.resource ? `[Resource: ${entry.resource}]` : '';

  console.info(`[AUDIT] ${fullEntry.timestamp} | ${entry.action} | ${statusStr} | ${adminStr} ${ipStr} ${resStr}`);
}

export function getRecentAuditLogs(limit = 50): AuditEntry[] {
  return auditBuffer.slice(0, limit);
}
