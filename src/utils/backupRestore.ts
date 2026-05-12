import { ADMIN_STORAGE_KEYS, readAdminJson, writeAdminJson } from './adminStorage';
import { writeAuditLog } from './auditLog';
import { normalizeAnswers, normalizeQuestionResponses, normalizeScoringConfigResponses } from './answerFormat';
import type { AssessmentResult, CurrentSession, Question, ScoringConfig, TokenSessionBinding } from '../types';

export interface BackupPayload {
  exportedAt: string;
  app: 'sppg-mmpi2-admin';
  version: 1;
  data: Partial<Record<keyof typeof ADMIN_STORAGE_KEYS, unknown>>;
}

const normalizeBackupValue = (name: keyof typeof ADMIN_STORAGE_KEYS, value: unknown) => {
  if (name === 'questions' && Array.isArray(value)) return (value as Question[]).map(normalizeQuestionResponses);
  if (name === 'scoringConfig' && value) return normalizeScoringConfigResponses(value as ScoringConfig);
  if (name === 'currentSession' && value) return { ...(value as CurrentSession), answers: normalizeAnswers((value as CurrentSession).answers) };
  if (name === 'results' && Array.isArray(value)) return (value as AssessmentResult[]).map((result) => ({ ...result, answers: normalizeAnswers(result.answers) }));
  if (name === 'tokenSessions' && Array.isArray(value)) return (value as TokenSessionBinding[]).map((session) => ({ ...session, answers: normalizeAnswers(session.answers) }));
  return value;
};

export const createBackupPayload = (): BackupPayload => {
  writeAuditLog({ action: 'Backup', targetType: 'system', targetId: 'localStorage', description: 'Ekspor cadangan seluruh data lokal.' });
  return {
    exportedAt: new Date().toISOString(),
    app: 'sppg-mmpi2-admin',
    version: 1,
    data: Object.fromEntries(Object.entries(ADMIN_STORAGE_KEYS).map(([name, key]) => [name, normalizeBackupValue(name as keyof typeof ADMIN_STORAGE_KEYS, readAdminJson<unknown | null>(key, null))])) as BackupPayload['data'],
  };
};

export const restoreBackupPayload = (payload: BackupPayload) => {
  if (!payload || payload.app !== 'sppg-mmpi2-admin' || !payload.data) throw new Error('File backup tidak valid.');
  Object.entries(payload.data).forEach(([name, value]) => {
    const typedName = name as keyof typeof ADMIN_STORAGE_KEYS;
    const key = ADMIN_STORAGE_KEYS[typedName];
    if (key && value !== undefined) writeAdminJson(key, normalizeBackupValue(typedName, value));
  });
  writeAuditLog({ action: 'Restore', targetType: 'system', targetId: 'localStorage', description: 'Restore data dari file backup.' });
};

export const resetKeys = (names: Array<keyof typeof ADMIN_STORAGE_KEYS>) => {
  names.forEach((name) => localStorage.removeItem(ADMIN_STORAGE_KEYS[name]));
  writeAuditLog({ action: 'Reset data', targetType: 'system', targetId: names.join(','), description: 'Reset data lokal terpilih.' });
};

export interface AdvancedBackup { backupId: string; createdAt: string; createdBy: string; type: 'full' | 'batch' | 'result' | 'pre_import_snapshot' | 'pre_reset_snapshot'; description: string; data: Record<string, unknown>; checksum: string; }
export const BACKUPS_KEY = 'sppg_mmpi2_backups';
export const SNAPSHOTS_KEY = 'sppg_mmpi2_snapshots';
const checksum = (value: unknown) => { const text = JSON.stringify(value); let sum = 0; for (let i = 0; i < text.length; i += 1) sum = (sum + text.charCodeAt(i) * (i + 1)) % 1_000_000_007; return String(sum); };
const readBackups = (key: string) => readAdminJson<AdvancedBackup[]>(key, []);
const collectAppLocalStorage = () => Object.fromEntries(Object.keys(localStorage).filter((key) => key.startsWith('sppg_mmpi2_')).map((key) => [key, readAdminJson<unknown>(key, null)]));
export const createAdvancedBackup = (type: AdvancedBackup['type'] = 'full', description = '', createdBy = '', filter?: { batchId?: string; resultId?: string }) => { const data = collectAppLocalStorage(); const backup: AdvancedBackup = { backupId: crypto.randomUUID(), createdAt: new Date().toISOString(), createdBy, type, description, data: filter ? { ...data, filter } : data, checksum: '' }; backup.checksum = checksum(backup.data); const key = type.startsWith('pre_') ? SNAPSHOTS_KEY : BACKUPS_KEY; writeAdminJson(key, [backup, ...readBackups(key)].slice(0, 50)); writeAuditLog('Backup', 'backup', backup.backupId, `Backup ${type} dibuat.`, { description, filter }, 'info'); return backup; };
export const createPreImportSnapshot = (description = 'Snapshot otomatis sebelum import config') => createAdvancedBackup('pre_import_snapshot', description);
export const createPreResetSnapshot = (description = 'Snapshot otomatis sebelum reset') => createAdvancedBackup('pre_reset_snapshot', description);
export const restoreAdvancedBackup = (backup: AdvancedBackup) => { if (backup.checksum !== checksum(backup.data)) throw new Error('Checksum backup tidak cocok.'); Object.entries(backup.data).forEach(([key, value]) => { if (key.startsWith('sppg_mmpi2_')) writeAdminJson(key, value); }); writeAuditLog('Restore', 'backup', backup.backupId, `Restore backup ${backup.type}.`, {}, 'critical'); };
export const getAdvancedBackups = () => ({ backups: readBackups(BACKUPS_KEY), snapshots: readBackups(SNAPSHOTS_KEY) });
