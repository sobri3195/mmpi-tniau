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
  writeAuditLog({ action: 'Backup', targetType: 'system', targetId: 'localStorage', description: 'Export backup seluruh data lokal.' });
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
