import sampleQuestions from '../data/sampleQuestions.json';
import sampleScoringConfig from '../data/sampleScoringConfig.json';
import type { AssessmentResult, CurrentSession, Question, ScoringConfig } from '../types';

const BUNDLED_QUESTIONS = sampleQuestions as Question[];

export const STORAGE_KEYS = {
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

const writeJson = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));

const isLegacyPlaceholderBank = (questions: Question[]) =>
  questions.length > 0 &&
  questions.length < BUNDLED_QUESTIONS.length &&
  questions.some((question) => question.text.toLowerCase().includes('placeholder'));

export const loadQuestions = (): Question[] => {
  const savedQuestions = readJson<Question[] | null>(STORAGE_KEYS.questions, null);
  if (!savedQuestions?.length || isLegacyPlaceholderBank(savedQuestions)) return BUNDLED_QUESTIONS;
  return savedQuestions;
};
export const saveQuestions = (questions: Question[]) => writeJson(STORAGE_KEYS.questions, questions);
export const loadDemoQuestions = (): Question[] => BUNDLED_QUESTIONS;

export const loadScoringConfig = (): ScoringConfig | null => readJson<ScoringConfig | null>(STORAGE_KEYS.scoringConfig, null);
export const saveScoringConfig = (config: ScoringConfig) => writeJson(STORAGE_KEYS.scoringConfig, config);
export const loadDemoScoringConfig = (): ScoringConfig => sampleScoringConfig as ScoringConfig;

export const loadCurrentSession = (): CurrentSession | null => readJson<CurrentSession | null>(STORAGE_KEYS.currentSession, null);
export const saveCurrentSession = (session: CurrentSession) => writeJson(STORAGE_KEYS.currentSession, session);
export const clearCurrentSession = () => localStorage.removeItem(STORAGE_KEYS.currentSession);

export const loadResults = (): AssessmentResult[] => readJson<AssessmentResult[]>(STORAGE_KEYS.results, []);
export const saveResult = (result: AssessmentResult) => {
  const results = loadResults().filter((item) => item.id !== result.id);
  writeJson(STORAGE_KEYS.results, [result, ...results]);
};
export const saveResults = (results: AssessmentResult[]) => writeJson(STORAGE_KEYS.results, results);

export const exportResults = () => loadResults();

export const resetAllLocalData = () => Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
