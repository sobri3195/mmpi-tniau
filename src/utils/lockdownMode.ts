import { readAdminJson, writeAdminJson } from './adminStorage';
import { writeAuditLog } from './auditLog';
export interface LockdownMode { enabled: boolean; reason: string; enabledAt: string; enabledBy: string; }
export const LOCKDOWN_KEY = 'sppg_mmpi2_lockdown_mode';
export const getLockdownMode = () => readAdminJson<LockdownMode>(LOCKDOWN_KEY, { enabled: false, reason: '', enabledAt: '', enabledBy: '' });
export const setLockdownMode = (enabled: boolean, reason = '', enabledBy = '') => { const value = { enabled, reason, enabledAt: enabled ? new Date().toISOString() : '', enabledBy }; writeAdminJson(LOCKDOWN_KEY, value); writeAuditLog(enabled ? 'Enable lockdown mode' : 'Disable lockdown mode', 'system', 'lockdown', enabled ? 'Lockdown mode diaktifkan.' : 'Lockdown mode dinonaktifkan.', { reason }, enabled ? 'critical' : 'warning'); return value; };
export const canStartNewParticipantSession = () => !getLockdownMode().enabled;
export const canImportConfig = () => !getLockdownMode().enabled;
