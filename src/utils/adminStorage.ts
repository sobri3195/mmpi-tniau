import type { AssessmentResult, Question, ScoringConfig } from '../types';

export const ADMIN_STORAGE_KEYS = {
  questions: 'sppg_mmpi2_questions',
  scoringConfig: 'sppg_mmpi2_scoring_config',
  normTable: 'sppg_mmpi2_norm_table',
  interpretationConfig: 'sppg_mmpi2_interpretation_config',
  codeTypeConfig: 'sppg_mmpi2_code_type_config',
  results: 'sppg_mmpi2_results',
  currentSession: 'sppg_mmpi2_current_session',
  adminSettings: 'sppg_mmpi2_admin_settings',
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

export const loadAdminQuestions = () => readAdminJson<Question[]>(ADMIN_STORAGE_KEYS.questions, []);
export const saveAdminQuestions = (questions: Question[]) => writeAdminJson(ADMIN_STORAGE_KEYS.questions, questions);
export const loadAdminScoringConfig = () => readAdminJson<ScoringConfig | null>(ADMIN_STORAGE_KEYS.scoringConfig, null);
export const saveAdminScoringConfig = (config: ScoringConfig) => writeAdminJson(ADMIN_STORAGE_KEYS.scoringConfig, config);
export const loadAdminResults = () => readAdminJson<AssessmentResult[]>(ADMIN_STORAGE_KEYS.results, []);
export const saveAdminResults = (results: AssessmentResult[]) => writeAdminJson(ADMIN_STORAGE_KEYS.results, results);
export const loadAdminSettings = () => readAdminJson<AdminReportSettings>(ADMIN_STORAGE_KEYS.adminSettings, {});
export const saveAdminSettings = (settings: AdminReportSettings) => writeAdminJson(ADMIN_STORAGE_KEYS.adminSettings, settings);

export const loadAuxConfig = <T = unknown>(key: 'normTable' | 'interpretationConfig' | 'codeTypeConfig') => readAdminJson<T | null>(ADMIN_STORAGE_KEYS[key], null);
export const saveAuxConfig = (key: 'normTable' | 'interpretationConfig' | 'codeTypeConfig', value: unknown) => writeAdminJson(ADMIN_STORAGE_KEYS[key], value);
export const clearAdminDataKey = (key: AdminStorageKey) => removeAdminKey(ADMIN_STORAGE_KEYS[key]);
