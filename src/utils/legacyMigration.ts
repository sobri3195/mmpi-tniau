import { writeAuditLog } from './auditLog';
import { ADMIN_STORAGE_KEYS } from './adminStorage';
import { normalizeAnswers, normalizeQuestionResponses, normalizeScoringConfigResponses, hasLegacyAnswerValue } from './answerFormat';
import type { AssessmentResult, CurrentSession, Question, ScoringConfig, TokenSessionBinding } from '../types';

const read = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));

const hasLegacyInAnswers = (answers: Record<string, unknown> = {}) => Object.values(answers).some(hasLegacyAnswerValue);
const hasLegacyQuestions = (questions: Question[] = []) => questions.some((question) => question.responseType !== 'plus_minus' || (question.options ?? []).some((option) => hasLegacyAnswerValue(option.value) || !['+', '-'].includes(String(option.label))));
const hasLegacyScoring = (config: ScoringConfig | null) => Boolean(config?.scales?.some((scale) => scale.items?.some((item) => hasLegacyAnswerValue(item.scoredResponse))));

export const detectLegacyResponseData = () => {
  const questions = read<Question[]>(ADMIN_STORAGE_KEYS.questions, []);
  const config = read<ScoringConfig | null>(ADMIN_STORAGE_KEYS.scoringConfig, null);
  const currentSession = read<CurrentSession | null>(ADMIN_STORAGE_KEYS.currentSession, null);
  const results = read<AssessmentResult[]>(ADMIN_STORAGE_KEYS.results, []);
  const tokenSessions = read<TokenSessionBinding[]>(ADMIN_STORAGE_KEYS.tokenSessions, []);
  return {
    questions: hasLegacyQuestions(questions),
    scoringConfig: hasLegacyScoring(config),
    currentSession: Boolean(currentSession && hasLegacyInAnswers(currentSession.answers)),
    results: results.filter((result) => hasLegacyInAnswers(result.answers)).length,
    tokenSessions: tokenSessions.filter((session) => hasLegacyInAnswers(session.answers)).length,
  };
};

export const hasLegacyResponseData = () => {
  const report = detectLegacyResponseData();
  return report.questions || report.scoringConfig || report.currentSession || report.results > 0 || report.tokenSessions > 0;
};

export const migrateLegacyResponses = () => {
  const reportBefore = detectLegacyResponseData();
  const questions = read<Question[]>(ADMIN_STORAGE_KEYS.questions, []);
  if (questions.length) write(ADMIN_STORAGE_KEYS.questions, questions.map(normalizeQuestionResponses));

  const config = read<ScoringConfig | null>(ADMIN_STORAGE_KEYS.scoringConfig, null);
  if (config) write(ADMIN_STORAGE_KEYS.scoringConfig, normalizeScoringConfigResponses(config));

  const currentSession = read<CurrentSession | null>(ADMIN_STORAGE_KEYS.currentSession, null);
  if (currentSession) write(ADMIN_STORAGE_KEYS.currentSession, { ...currentSession, answers: normalizeAnswers(currentSession.answers) });

  const results = read<AssessmentResult[]>(ADMIN_STORAGE_KEYS.results, []);
  if (results.length) write(ADMIN_STORAGE_KEYS.results, results.map((result) => ({ ...result, answers: normalizeAnswers(result.answers) })));

  const tokenSessions = read<TokenSessionBinding[]>(ADMIN_STORAGE_KEYS.tokenSessions, []);
  if (tokenSessions.length) write(ADMIN_STORAGE_KEYS.tokenSessions, tokenSessions.map((session) => ({ ...session, answers: normalizeAnswers(session.answers) })));

  writeAuditLog({ action: 'Migrasi format jawaban', targetType: 'config', targetId: 'plus-minus', description: 'Admin mengonversi data lama Ya/Tidak, Benar/Salah, true/false menjadi + dan -.' });
  return reportBefore;
};
