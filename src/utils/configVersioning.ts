import { ADMIN_STORAGE_KEYS, readAdminJson, writeAdminJson } from './adminStorage';
import { validateBeforePublish } from './configValidation';
import { writeAuditLog } from './auditLog';

export type ConfigType = 'questions' | 'scoringConfig' | 'normTable' | 'interpretationRusdi' | 'interpretationHubertus' | 'codeTypeRusdi' | 'codeTypeHubertus' | 'summaryAnalysis' | 'reportTemplate' | 'rhTemplate';
export type ConfigStatus = 'draft' | 'validated' | 'active' | 'archived' | 'rejected';
export interface ConfigVersion { configVersionId: string; configType: ConfigType; versionName: string; status: ConfigStatus; createdBy: string; createdAt: string; reviewedBy: string; reviewedAt: string; activatedBy: string; activatedAt: string; sourceName: string; licenseMetadata: { sourceDocument: string; licenseStatus: string; notes: string }; changelog: string; validationResult: unknown; configSnapshot: unknown; }
export type ConfigVersionsUsed = { questionsVersionId: string; scoringConfigVersionId: string; normTableVersionId: string; rusdiInterpretationVersionId: string; hubertusInterpretationVersionId: string; summaryAnalysisVersionId: string; reportTemplateVersionId: string; };

export const CONFIG_VERSIONS_KEY = 'sppg_mmpi2_config_versions';
export const getConfigVersions = () => readAdminJson<ConfigVersion[]>(CONFIG_VERSIONS_KEY, []);
const saveVersions = (versions: ConfigVersion[]) => writeAdminJson(CONFIG_VERSIONS_KEY, versions);

export const createConfigVersion = (input: Partial<ConfigVersion> & Pick<ConfigVersion, 'configType' | 'configSnapshot'>) => {
  const version: ConfigVersion = {
    configVersionId: crypto.randomUUID(), configType: input.configType, versionName: input.versionName || `v${new Date().toISOString()}`,
    status: 'draft', createdBy: input.createdBy || '', createdAt: new Date().toISOString(), reviewedBy: '', reviewedAt: '', activatedBy: '', activatedAt: '',
    sourceName: input.sourceName || '', licenseMetadata: input.licenseMetadata || { sourceDocument: '', licenseStatus: 'unverified', notes: '' }, changelog: input.changelog || '', validationResult: {}, configSnapshot: input.configSnapshot,
  };
  saveVersions([version, ...getConfigVersions()]);
  writeAuditLog('Create config version', 'configVersion', version.configVersionId, `Versi ${version.configType} dibuat sebagai draft.`, { configType: version.configType }, 'info');
  return version;
};

export const validateConfigVersion = (configVersionId: string) => {
  const versions = getConfigVersions();
  const version = versions.find((item) => item.configVersionId === configVersionId);
  if (!version) throw new Error('Versi konfigurasi tidak ditemukan.');
  const validation = validateBeforePublish(version.configType, version.configSnapshot);
  version.validationResult = validation;
  version.status = validation.valid ? 'validated' : 'rejected';
  version.reviewedAt = new Date().toISOString();
  saveVersions(versions);
  writeAuditLog('Validate config version', 'configVersion', configVersionId, `Validasi ${version.configType}: ${version.status}.`, { validation }, validation.valid ? 'info' : 'warning');
  return version;
};

export const canActivateConfig = (version: ConfigVersion) => version.status === 'validated' && Boolean((version.validationResult as { valid?: boolean })?.valid);
export const activateConfigVersion = (configVersionId: string, activatedBy = '') => {
  const versions = getConfigVersions();
  const version = versions.find((item) => item.configVersionId === configVersionId);
  if (!version) throw new Error('Versi konfigurasi tidak ditemukan.');
  if (!canActivateConfig(version)) throw new Error('Config harus valid/validated sebelum active.');
  versions.forEach((item) => { if (item.configType === version.configType && item.status === 'active') item.status = 'archived'; });
  version.status = 'active'; version.activatedAt = new Date().toISOString(); version.activatedBy = activatedBy;
  saveVersions(versions);
  writeAuditLog('Activate config version', 'configVersion', configVersionId, `Versi aktif ${version.configType}: ${version.versionName}.`, {}, 'critical');
  return version;
};
export const archiveConfigVersion = (configVersionId: string) => { const versions = getConfigVersions(); const version = versions.find((item) => item.configVersionId === configVersionId); if (!version) throw new Error('Versi konfigurasi tidak ditemukan.'); version.status = 'archived'; saveVersions(versions); writeAuditLog('Archive config version', 'configVersion', configVersionId, `Versi ${version.configType} diarsipkan.`, {}, 'warning'); return version; };
export const rollbackConfigVersion = (configVersionId: string, activatedBy = '') => activateConfigVersion(configVersionId, activatedBy);
export const getActiveConfigVersion = (configType: ConfigType) => getConfigVersions().find((version) => version.configType === configType && version.status === 'active') ?? null;
export const attachConfigVersionsToResult = <T extends object>(result: T): T & { configVersionsUsed: ConfigVersionsUsed } => ({ ...result, configVersionsUsed: { questionsVersionId: getActiveConfigVersion('questions')?.configVersionId ?? '', scoringConfigVersionId: getActiveConfigVersion('scoringConfig')?.configVersionId ?? '', normTableVersionId: getActiveConfigVersion('normTable')?.configVersionId ?? '', rusdiInterpretationVersionId: getActiveConfigVersion('interpretationRusdi')?.configVersionId ?? '', hubertusInterpretationVersionId: getActiveConfigVersion('interpretationHubertus')?.configVersionId ?? '', summaryAnalysisVersionId: getActiveConfigVersion('summaryAnalysis')?.configVersionId ?? '', reportTemplateVersionId: getActiveConfigVersion('reportTemplate')?.configVersionId ?? '' } });
