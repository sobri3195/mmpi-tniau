import { ADMIN_STORAGE_KEYS, readAdminJson, writeAdminJson } from './adminStorage';
import { writeAuditLog } from './auditLog';

export interface BackupPayload {
  exportedAt: string;
  app: 'sppg-mmpi2-admin';
  version: 1;
  data: Partial<Record<keyof typeof ADMIN_STORAGE_KEYS, unknown>>;
}

export const createBackupPayload = (): BackupPayload => {
  writeAuditLog({ action: 'Backup', targetType: 'system', targetId: 'localStorage', description: 'Export backup seluruh data lokal.' });
  return {
  exportedAt: new Date().toISOString(),
  app: 'sppg-mmpi2-admin',
  version: 1,
  data: Object.fromEntries(Object.entries(ADMIN_STORAGE_KEYS).map(([name, key]) => [name, readAdminJson<unknown | null>(key, null)])) as BackupPayload['data'],
};
};

export const restoreBackupPayload = (payload: BackupPayload) => {
  if (!payload || payload.app !== 'sppg-mmpi2-admin' || !payload.data) throw new Error('File backup tidak valid.');
  Object.entries(payload.data).forEach(([name, value]) => {
    const key = ADMIN_STORAGE_KEYS[name as keyof typeof ADMIN_STORAGE_KEYS];
    if (key && value !== undefined) writeAdminJson(key, value);
  });
  writeAuditLog({ action: 'Restore', targetType: 'system', targetId: 'localStorage', description: 'Restore data dari file backup.' });
};

export const resetKeys = (names: Array<keyof typeof ADMIN_STORAGE_KEYS>) => {
  names.forEach((name) => localStorage.removeItem(ADMIN_STORAGE_KEYS[name]));
  writeAuditLog({ action: 'Reset data', targetType: 'system', targetId: names.join(','), description: 'Reset data lokal terpilih.' });
};
