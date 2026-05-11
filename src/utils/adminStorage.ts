import type { AssessmentResult, Question, ScoringConfig } from '../types';
import { writeAuditLog } from './auditLog';
import { normalizeQuestions } from './questions';
import { normalizeResultAnswers, normalizeScoringConfigResponses } from './answerFormat';

export const ADMIN_STORAGE_KEYS = {
  questions: 'sppg_mmpi2_questions',
  scoringConfig: 'sppg_mmpi2_scoring_config',
  normTable: 'sppg_mmpi2_norm_table',
  interpretationConfig: 'sppg_mmpi2_interpretation_config',
  interpretationRusdiMaslim: 'sppg_mmpi2_interpretation_rusdi_maslim',
  interpretationHubertus: 'sppg_mmpi2_interpretation_hubertus',
  codeTypeConfig: 'sppg_mmpi2_code_type_config',
  codeTypeRusdiMaslim: 'sppg_mmpi2_code_type_rusdi_maslim',
  codeTypeHubertus: 'sppg_mmpi2_code_type_hubertus',
  results: 'sppg_mmpi2_results',
  currentSession: 'sppg_mmpi2_current_session',
  accessTokens: 'sppg_mmpi2_access_tokens',
  users: 'sppg_mmpi2_users',
  authSession: 'sppg_mmpi2_auth_session',
  auditLogs: 'sppg_mmpi2_audit_logs',
  tokenSessions: 'sppg_mmpi2_token_sessions',
  adminSettings: 'sppg_mmpi2_admin_settings',
  summaryAnalysisConfig: 'sppg_mmpi2_summary_analysis_config',
} as const;

export const ADMIN_PIN_KEY = 'sppg_mmpi2_admin_pin';
export const ADMIN_AUTH_KEY = 'sppg_mmpi2_admin_authenticated';

export type AdminStorageKey = keyof typeof ADMIN_STORAGE_KEYS;

export interface AdminReportSettings {
  dark?: boolean;
  institutionName?: string;
  institutionLogo?: string;
  reportTitle?: string;
  reportSubtitle?: string;
  defaultExaminer?: string;
  licenseNumber?: string;
  disclaimerText?: string;
  signatureText?: string;
  showClinicalChart?: boolean;
  showValidityChart?: boolean;
  showRawScore?: boolean;
  showAnswers?: boolean;
  reportMode?: 'Screening' | 'Klinis' | 'Personel/Militer';
}

export const readAdminJson = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const writeAdminJson = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));
export const removeAdminKey = (key: string) => localStorage.removeItem(key);

export const loadAdminQuestions = () => {
  const questions = normalizeQuestions(readAdminJson<Question[]>(ADMIN_STORAGE_KEYS.questions, []));
  if (questions.length) writeAdminJson(ADMIN_STORAGE_KEYS.questions, questions);
  return questions;
};
export const saveAdminQuestions = (questions: Question[]) => { writeAdminJson(ADMIN_STORAGE_KEYS.questions, normalizeQuestions(questions)); writeAuditLog({ action: 'Impor questions', targetType: 'config', targetId: 'questions', description: `Impor bank soal ${questions.length} item.` }); };
export const loadAdminScoringConfig = () => {
  const config = readAdminJson<ScoringConfig | null>(ADMIN_STORAGE_KEYS.scoringConfig, null);
  if (!config) return null;
  const normalized = normalizeScoringConfigResponses(config);
  writeAdminJson(ADMIN_STORAGE_KEYS.scoringConfig, normalized);
  return normalized;
};
export const saveAdminScoringConfig = (config: ScoringConfig) => { writeAdminJson(ADMIN_STORAGE_KEYS.scoringConfig, normalizeScoringConfigResponses(config)); writeAuditLog({ action: 'Impor scoring config', targetType: 'config', targetId: 'scoringConfig', description: 'Impor scoringConfig.' }); };
export const loadAdminResults = () => {
  const results = readAdminJson<AssessmentResult[]>(ADMIN_STORAGE_KEYS.results, []).map(normalizeResultAnswers);
  writeAdminJson(ADMIN_STORAGE_KEYS.results, results);
  return results;
};
export const saveAdminResults = (results: AssessmentResult[]) => writeAdminJson(ADMIN_STORAGE_KEYS.results, results.map(normalizeResultAnswers));
export const loadAdminSettings = () => readAdminJson<AdminReportSettings>(ADMIN_STORAGE_KEYS.adminSettings, {});
export const saveAdminSettings = (settings: AdminReportSettings) => writeAdminJson(ADMIN_STORAGE_KEYS.adminSettings, settings);

export const loadAuxConfig = <T = unknown>(key: 'normTable' | 'interpretationConfig' | 'interpretationRusdiMaslim' | 'interpretationHubertus' | 'codeTypeConfig' | 'codeTypeRusdiMaslim' | 'codeTypeHubertus' | 'summaryAnalysisConfig') => readAdminJson<T | null>(ADMIN_STORAGE_KEYS[key], null);
export const saveAuxConfig = (key: 'normTable' | 'interpretationConfig' | 'interpretationRusdiMaslim' | 'interpretationHubertus' | 'codeTypeConfig' | 'codeTypeRusdiMaslim' | 'codeTypeHubertus' | 'summaryAnalysisConfig', value: unknown) => {
  writeAdminJson(ADMIN_STORAGE_KEYS[key], value);
  const action = key === 'normTable' ? 'Impor norm table' : key === 'interpretationConfig' ? 'Impor interpretation config' : 'Impor code type config';
  writeAuditLog({ action, targetType: 'config', targetId: key, description: `Impor ${key}.` });
};
export const clearAdminDataKey = (key: AdminStorageKey) => removeAdminKey(ADMIN_STORAGE_KEYS[key]);
