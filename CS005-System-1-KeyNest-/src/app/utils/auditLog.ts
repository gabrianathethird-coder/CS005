/**
 * Audit logging utilities for tracking cryptographic events
 */

const AUDIT_LOG_KEY = 'aegis_audit_log';

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  event: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  details: string;
}

/**
 * Add a new entry to the audit log
 */
export function addAuditLog(
  event: string,
  severity: AuditLogEntry['severity'],
  details: string
): void {
  const logs = getAuditLogs();
  
  const newEntry: AuditLogEntry = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    event,
    severity,
    details,
  };

  logs.unshift(newEntry); // Add to beginning for reverse chronological order
  
  // Keep only the last 1000 entries to prevent unbounded growth
  if (logs.length > 1000) {
    logs.splice(1000);
  }

  localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(logs));
}

/**
 * Retrieve all audit log entries
 */
export function getAuditLogs(): AuditLogEntry[] {
  const stored = localStorage.getItem(AUDIT_LOG_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Clear all audit logs
 */
export function clearAuditLogs(): void {
  localStorage.removeItem(AUDIT_LOG_KEY);
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}
