import sampleQuestions from '../data/sampleQuestions.json';
import sampleScoringConfig from '../data/sampleScoringConfig.json';
import type { AccessToken, AssessmentResult, CurrentSession, Question, RHForm, ScoringConfig } from '../types';
import { normalizeQuestions } from './questions';
import { normalizeResultAnswers, normalizeScoringConfigResponses, normalizeSessionAnswers } from './answerFormat';

const BUNDLED_QUESTIONS = normalizeQuestions(sampleQuestions as Question[]);

export const STORAGE_KEYS = {
  questions: 'sppg_mmpi2_questions',
  scoringConfig: 'sppg_mmpi2_scoring_config',
  currentSession: 'sppg_mmpi2_current_session',
  accessTokens: 'sppg_mmpi2_access_tokens',
  tokenSessions: 'sppg_mmpi2_token_sessions',
  results: 'sppg_mmpi2_results',
  rhForms: 'sppg_mmpi2_rh_forms',
  adminSettings: 'sppg_mmpi2_admin_settings',
  interpretationConfig: 'sppg_mmpi2_interpretation_config',
  interpretationRusdiMaslim: 'sppg_mmpi2_interpretation_rusdi_maslim',
  interpretationHubertus: 'sppg_mmpi2_interpretation_hubertus',
  codeTypeRusdiMaslim: 'sppg_mmpi2_code_type_rusdi_maslim',
  codeTypeHubertus: 'sppg_mmpi2_code_type_hubertus',
  normTable: 'sppg_mmpi2_norm_table',
  codeTypeConfig: 'sppg_mmpi2_code_type_config',
  summaryAnalysisConfig: 'sppg_mmpi2_summary_analysis_config',
  configValidationStatus: 'sppg_mmpi2_config_validation_status',
  accessibilitySettings: 'sppg_mmpi2_accessibility_settings',
} as const;

const LEGACY_STORAGE_KEYS = {
  questions: 'sppg_mmpi_questions',
  scoringConfig: 'sppg_mmpi_scoring_config',
  currentSession: 'sppg_mmpi_current_session',
  results: 'sppg_mmpi_results',
  adminSettings: 'sppg_mmpi_admin_settings',
} as const;

const readJson = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const readJsonWithLegacy = <T>(key: string, legacyKey: string, fallback: T): T => {
  const current = readJson<T | null>(key, null);
  if (current !== null) return current as T;
  const legacy = readJson<T | null>(legacyKey, null);
  if (legacy !== null && typeof window !== 'undefined') {
    writeJson(key, legacy);
  }
  return legacy ?? fallback;
};

const writeJson = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));

export interface TestAccessibilitySettings {
  fontSize: 'normal' | 'large' | 'extra_large';
  highContrast: boolean;
  largeAnswerButtons: boolean;
}

const DEFAULT_ACCESSIBILITY_SETTINGS: TestAccessibilitySettings = {
  fontSize: 'normal',
  highContrast: false,
  largeAnswerButtons: true,
};

const normalizeAccessibilitySettings = (settings: Partial<TestAccessibilitySettings> & { largeFont?: boolean } = {}): TestAccessibilitySettings => ({
  fontSize: settings.fontSize ?? (settings.largeFont ? 'large' : DEFAULT_ACCESSIBILITY_SETTINGS.fontSize),
  highContrast: settings.highContrast ?? DEFAULT_ACCESSIBILITY_SETTINGS.highContrast,
  largeAnswerButtons: settings.largeAnswerButtons ?? DEFAULT_ACCESSIBILITY_SETTINGS.largeAnswerButtons,
});

const isIncompleteQuestionBank = (questions: Question[]) => questions.length !== BUNDLED_QUESTIONS.length;

const isLegacyPlaceholderBank = (questions: Question[]) =>
  questions.length > 0 &&
  questions.length < BUNDLED_QUESTIONS.length &&
  questions.some((question) => question.text.toLowerCase().includes('placeholder'));

export const loadQuestions = (): Question[] => {
  const savedQuestions = readJsonWithLegacy<Question[] | null>(STORAGE_KEYS.questions, LEGACY_STORAGE_KEYS.questions, null);
  if (!savedQuestions?.length || isIncompleteQuestionBank(savedQuestions) || isLegacyPlaceholderBank(savedQuestions)) return BUNDLED_QUESTIONS;
  const normalized = normalizeQuestions(savedQuestions);
  writeJson(STORAGE_KEYS.questions, normalized);
  return normalized;
};
export const saveQuestions = (questions: Question[]) => writeJson(STORAGE_KEYS.questions, normalizeQuestions(questions));
export const loadDemoQuestions = (): Question[] => BUNDLED_QUESTIONS;

export const loadScoringConfig = (): ScoringConfig | null => {
  const config = readJsonWithLegacy<ScoringConfig | null>(STORAGE_KEYS.scoringConfig, LEGACY_STORAGE_KEYS.scoringConfig, null);
  if (!config) return null;
  const normalized = normalizeScoringConfigResponses(config);
  writeJson(STORAGE_KEYS.scoringConfig, normalized);
  return normalized;
};
export const saveScoringConfig = (config: ScoringConfig) => writeJson(STORAGE_KEYS.scoringConfig, normalizeScoringConfigResponses(config));
export const clearScoringConfig = () => localStorage.removeItem(STORAGE_KEYS.scoringConfig);
export const loadDemoScoringConfig = (): ScoringConfig => normalizeScoringConfigResponses(sampleScoringConfig as ScoringConfig);

export const loadCurrentSession = (): CurrentSession | null => {
  const session = readJsonWithLegacy<CurrentSession | null>(STORAGE_KEYS.currentSession, LEGACY_STORAGE_KEYS.currentSession, null);
  if (!session) return null;
  const normalized = normalizeSessionAnswers(session);
  writeJson(STORAGE_KEYS.currentSession, normalized);
  return normalized;
};
export const saveCurrentSession = (session: CurrentSession) => writeJson(STORAGE_KEYS.currentSession, normalizeSessionAnswers(session));
export const clearCurrentSession = () => localStorage.removeItem(STORAGE_KEYS.currentSession);


const PARTICIPANT_BLOCKING_TOKEN_STATUSES: AccessToken['status'][] = ['disabled', 'revoked', 'expired', 'completed'];
const isProductionMode = () => Boolean(import.meta.env.PROD);
const isSeededDemoToken = (token: AccessToken) => token.isSeededDemo === true || token.metadata?.isSeededDemo === true;

export const cleanupInvalidParticipantSession = () => {
  if (typeof window === 'undefined') return null;
  const tokens = readJson<AccessToken[]>(STORAGE_KEYS.accessTokens, []);
  const now = new Date().toISOString();
  let tokensChanged = false;
  const normalizedTokens = tokens.map((token) => {
    if (!isProductionMode() || !isSeededDemoToken(token) || (token.status === 'disabled' && token.isEnabled === false)) return token;
    tokensChanged = true;
    return { ...token, status: 'disabled' as const, isEnabled: false, disabledAt: token.disabledAt ?? now, disabledBy: token.disabledBy ?? 'system', disableReason: token.disableReason || 'Demo token disabled in production mode', activeSessionId: null };
  });
  if (tokensChanged) writeJson(STORAGE_KEYS.accessTokens, normalizedTokens);

  const session = readJsonWithLegacy<CurrentSession | null>(STORAGE_KEYS.currentSession, LEGACY_STORAGE_KEYS.currentSession, null);
  if (!session) return null;
  if (!session.tokenId) {
    clearCurrentSession();
    return null;
  }
  const token = normalizedTokens.find((item) => item.tokenId === session.tokenId);
  const sessionCompleted = session.sessionStatus === 'completed' || session.status === 'completed';
  if (!token || token.isEnabled !== true || PARTICIPANT_BLOCKING_TOKEN_STATUSES.includes(token.status) || session.sessionStatus === 'paused_token_disabled' || sessionCompleted) {
    clearCurrentSession();
    return null;
  }
  return normalizeSessionAnswers(session);
};

export const loadAccessibilitySettings = (): TestAccessibilitySettings => normalizeAccessibilitySettings(readJson<Partial<TestAccessibilitySettings> & { largeFont?: boolean }>(STORAGE_KEYS.accessibilitySettings, DEFAULT_ACCESSIBILITY_SETTINGS));
export const saveAccessibilitySettings = (settings: TestAccessibilitySettings) => writeJson(STORAGE_KEYS.accessibilitySettings, normalizeAccessibilitySettings(settings));

export const loadResults = (): AssessmentResult[] => {
  const results = readJsonWithLegacy<AssessmentResult[]>(STORAGE_KEYS.results, LEGACY_STORAGE_KEYS.results, []).map(normalizeResultAnswers);
  writeJson(STORAGE_KEYS.results, results);
  return results;
};
export const saveResult = (result: AssessmentResult) => {
  const results = loadResults().filter((item) => item.id !== result.id);
  writeJson(STORAGE_KEYS.results, [normalizeResultAnswers(result), ...results.map(normalizeResultAnswers)]);
};
export const saveResults = (results: AssessmentResult[]) => writeJson(STORAGE_KEYS.results, results.map(normalizeResultAnswers));

export const loadRHForms = (): RHForm[] => readJson<RHForm[]>(STORAGE_KEYS.rhForms, []);
export const saveRHForms = (forms: RHForm[]) => writeJson(STORAGE_KEYS.rhForms, forms);
export const saveRHForm = (form: RHForm) => saveRHForms([form, ...loadRHForms().filter((item) => item.rhFormId !== form.rhFormId)]);
export const getRHFormByResultId = (resultId: string) => loadRHForms().find((form) => form.resultId === resultId) || null;
export const getRHFormByTokenId = (tokenId: string) => loadRHForms().find((form) => form.tokenId === tokenId && form.status !== 'completed') || loadRHForms().find((form) => form.tokenId === tokenId) || null;

export const exportResults = () => loadResults();

export const resetParticipantData = () => [STORAGE_KEYS.currentSession, STORAGE_KEYS.results, STORAGE_KEYS.rhForms].forEach((key) => localStorage.removeItem(key));
export const resetAllLocalData = () => Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));

export const saveAuxiliaryConfig = (key: 'interpretationConfig' | 'interpretationRusdiMaslim' | 'interpretationHubertus' | 'normTable' | 'codeTypeConfig' | 'codeTypeRusdiMaslim' | 'codeTypeHubertus' | 'summaryAnalysisConfig', value: unknown) => writeJson(STORAGE_KEYS[key], value);
export const loadAuxiliaryConfig = <T = unknown>(key: 'interpretationConfig' | 'interpretationRusdiMaslim' | 'interpretationHubertus' | 'normTable' | 'codeTypeConfig' | 'codeTypeRusdiMaslim' | 'codeTypeHubertus' | 'summaryAnalysisConfig'): T | null => readJson<T | null>(STORAGE_KEYS[key], null);
