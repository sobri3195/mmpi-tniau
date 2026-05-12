import { loadAdminResults, readAdminJson } from './adminStorage';
import { getAuditLogs } from './auditLog';
import { getConfigVersions } from './configVersioning';
import { writeAuditLog } from './auditLog';
export interface ArchiveBundle { archiveId: string; exportedAt: string; exportedBy: string; scope: 'single_result' | 'batch'; results: unknown[]; configVersions: unknown[]; auditLogs: unknown[]; rhForms: unknown[]; signatures: unknown[]; }
export const buildArchiveBundle = (scope: 'single_result' | 'batch', ids: string[] = [], exportedBy = ''): ArchiveBundle => { const results = loadAdminResults().filter((r) => scope === 'batch' ? !ids.length || ids.includes(r.tokenId || '') : ids.includes(r.id)); const bundle = { archiveId: crypto.randomUUID(), exportedAt: new Date().toISOString(), exportedBy, scope, results, configVersions: getConfigVersions(), auditLogs: getAuditLogs({ search: ids.join(' ') }), rhForms: readAdminJson<unknown[]>('sppg_mmpi2_rh_forms', []).filter((form) => results.some((r) => (form as { resultId?: string }).resultId === r.id)), signatures: results.map((r) => (r as { finalSignature?: unknown }).finalSignature).filter(Boolean) }; writeAuditLog('Export archive', 'archive', bundle.archiveId, `Export arsip ${scope}.`, { ids }, 'info'); return bundle; };
export const exportArchiveBundle = (bundle: ArchiveBundle) => JSON.stringify(bundle, null, 2);
