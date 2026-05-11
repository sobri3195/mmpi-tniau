import { ADMIN_STORAGE_KEYS, readAdminJson, writeAdminJson } from './adminStorage';
import type { AdminRole } from './roles';

export interface AuditLogEntry {
  logId: string;
  timestamp: string;
  userId: string;
  username: string;
  role: AdminRole | '';
  action: string;
  targetType: string;
  targetId: string;
  description: string;
}

const getSessionActor = () => readAdminJson<{ userId: string; username: string; role: AdminRole; expiresAt: string } | null>(ADMIN_STORAGE_KEYS.authSession, null);
export const getAuditLogs = () => readAdminJson<AuditLogEntry[]>(ADMIN_STORAGE_KEYS.auditLogs, []);

export const writeAuditLog = (entry: Partial<Omit<AuditLogEntry, 'logId' | 'timestamp'>> & Pick<AuditLogEntry, 'action' | 'description'>) => {
  const session = getSessionActor();
  const activeSession = session && new Date(session.expiresAt).getTime() > Date.now() ? session : null;
  const logs = getAuditLogs();
  const next: AuditLogEntry = {
    logId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    userId: entry.userId ?? activeSession?.userId ?? '',
    username: entry.username ?? activeSession?.username ?? 'system',
    role: entry.role ?? activeSession?.role ?? '',
    action: entry.action,
    targetType: entry.targetType ?? '',
    targetId: entry.targetId ?? '',
    description: entry.description,
  };
  writeAdminJson(ADMIN_STORAGE_KEYS.auditLogs, [next, ...logs].slice(0, 1000));
  return next;
};
