import { ADMIN_STORAGE_KEYS, readAdminJson, writeAdminJson } from './adminStorage';
import type { AdminRole } from './roles';

export type AuditSeverity = 'info' | 'warning' | 'critical';
export type AuditActorRole = AdminRole | 'participant' | 'system' | '';

export interface AuditActor { userId: string; username: string; displayName: string; role: AuditActorRole; }
export interface AuditLogEntry {
  logId: string;
  timestamp: string;
  actor: AuditActor;
  action: string;
  targetType: string;
  targetId: string;
  description: string;
  metadata: Record<string, unknown>;
  severity: AuditSeverity;
  /** Backward-compatible flattened fields used by older UI/tests. */
  userId?: string;
  username?: string;
  role?: AuditActorRole;
}
export interface AuditLogFilter { from?: string; to?: string; role?: string; action?: string; severity?: string; search?: string; }

type LegacyAuditInput = Partial<Omit<AuditLogEntry, 'logId' | 'timestamp' | 'actor'>> & { action: string; description: string; userId?: string; username?: string; displayName?: string; role?: AuditActorRole; actor?: Partial<AuditActor>; };

const getSessionActor = () => readAdminJson<{ userId: string; username: string; displayName?: string; role: AdminRole; expiresAt: string } | null>(ADMIN_STORAGE_KEYS.authSession, null);
const normalizeLog = (log: Partial<AuditLogEntry> & { userId?: string; username?: string; role?: AuditActorRole }): AuditLogEntry => {
  const actor = log.actor ?? { userId: log.userId ?? '', username: log.username ?? 'system', displayName: log.username ?? 'System', role: log.role ?? 'system' };
  return {
    logId: log.logId ?? crypto.randomUUID(),
    timestamp: log.timestamp ?? new Date().toISOString(),
    actor: { userId: actor.userId ?? '', username: actor.username ?? 'system', displayName: actor.displayName ?? actor.username ?? 'System', role: actor.role ?? 'system' },
    action: log.action ?? '',
    targetType: log.targetType ?? '',
    targetId: log.targetId ?? '',
    description: log.description ?? '',
    metadata: log.metadata ?? {},
    severity: log.severity ?? 'info',
    userId: actor.userId ?? '',
    username: actor.username ?? 'system',
    role: actor.role ?? 'system',
  };
};

export const getAuditLogs = (filter: AuditLogFilter = {}) => {
  const logs = readAdminJson<AuditLogEntry[]>(ADMIN_STORAGE_KEYS.auditLogs, []).map(normalizeLog);
  return logs.filter((log) => {
    const ts = new Date(log.timestamp).getTime();
    if (filter.from && ts < new Date(filter.from).getTime()) return false;
    if (filter.to && ts > new Date(filter.to).getTime() + 86_399_999) return false;
    if (filter.role && log.actor.role !== filter.role) return false;
    if (filter.action && !log.action.toLowerCase().includes(filter.action.toLowerCase())) return false;
    if (filter.severity && log.severity !== filter.severity) return false;
    if (filter.search && !JSON.stringify(log).toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });
};

export function writeAuditLog(action: string, targetType?: string, targetId?: string, description?: string, metadata?: Record<string, unknown>, severity?: AuditSeverity): AuditLogEntry;
export function writeAuditLog(entry: LegacyAuditInput): AuditLogEntry;
export function writeAuditLog(first: string | LegacyAuditInput, targetType = '', targetId = '', description = '', metadata: Record<string, unknown> = {}, severity: AuditSeverity = 'info') {
  const entry: LegacyAuditInput = typeof first === 'string' ? { action: first, targetType, targetId, description, metadata, severity } : first;
  const session = getSessionActor();
  const activeSession = session && new Date(session.expiresAt).getTime() > Date.now() ? session : null;
  const rawActor = entry.actor ?? {
    userId: entry.userId ?? activeSession?.userId ?? '',
    username: entry.username ?? activeSession?.username ?? 'system',
    displayName: entry.displayName ?? activeSession?.displayName ?? activeSession?.username ?? 'System',
    role: entry.role ?? activeSession?.role ?? 'system',
  };
  const actor: AuditActor = { userId: rawActor.userId ?? '', username: rawActor.username ?? 'system', displayName: rawActor.displayName ?? rawActor.username ?? 'System', role: rawActor.role ?? 'system' };
  const next = normalizeLog({ ...entry, actor, logId: crypto.randomUUID(), timestamp: new Date().toISOString(), severity: entry.severity ?? severity, metadata: entry.metadata ?? metadata });
  writeAdminJson(ADMIN_STORAGE_KEYS.auditLogs, [next, ...getAuditLogs()].slice(0, 5000));
  return next;
}

export const exportAuditLogs = (filter: AuditLogFilter = {}, format: 'json' | 'csv' = 'json') => {
  const logs = getAuditLogs(filter);
  if (format === 'csv') {
    const header = ['timestamp', 'role', 'username', 'action', 'targetType', 'targetId', 'severity', 'description'];
    return [header.join(','), ...logs.map((log) => header.map((key) => JSON.stringify(key === 'role' ? log.actor.role : key === 'username' ? log.actor.username : log[key as keyof AuditLogEntry] ?? '')).join(','))].join('\n');
  }
  return JSON.stringify(logs, null, 2);
};

export const clearAuditLogsOnlyBySuperadmin = () => {
  const actor = getSessionActor();
  if (actor?.role !== 'superadmin') throw new Error('Hanya Superadmin yang dapat menghapus audit log.');
  writeAdminJson(ADMIN_STORAGE_KEYS.auditLogs, []);
  writeAuditLog('Clear audit logs', 'audit', 'sppg_mmpi2_audit_logs', 'Audit log dikosongkan oleh Superadmin.', {}, 'critical');
};
