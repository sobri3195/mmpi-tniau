import type { AnswerValue, AssessmentResult, CurrentSession, Question, ScoringConfig } from '../types';

export const PLUS_RESPONSE = '+' as const;
export const MINUS_RESPONSE = '-' as const;
export const ANSWER_VALUES = [PLUS_RESPONSE, MINUS_RESPONSE] as const;
export const REQUIRED_TOTAL_QUESTIONS = 567;

export const isAnswerValue = (value: unknown): value is AnswerValue => value === PLUS_RESPONSE || value === MINUS_RESPONSE;

export const normalizeAnswerValue = (value: unknown): AnswerValue | undefined => {
  if (value === PLUS_RESPONSE || value === MINUS_RESPONSE) return value;
  if (value === true) return PLUS_RESPONSE;
  if (value === false) return MINUS_RESPONSE;
  const text = String(value ?? '').trim().toLowerCase();
  if (['true', '1', 'ya', 'yes', 'benar', 't', 'y', '+'].includes(text)) return PLUS_RESPONSE;
  if (['false', '0', 'tidak', 'no', 'salah', 'f', 'n', '-'].includes(text)) return MINUS_RESPONSE;
  return undefined;
};

export const hasLegacyAnswerValue = (value: unknown) => !isAnswerValue(value) && normalizeAnswerValue(value) !== undefined;

export const plusMinusOptions = () => [
  { label: PLUS_RESPONSE, value: PLUS_RESPONSE },
  { label: MINUS_RESPONSE, value: MINUS_RESPONSE },
];

export const normalizeQuestionResponses = (question: Question): Question => ({
  ...question,
  responseType: 'plus_minus',
  options: plusMinusOptions(),
});

export const normalizeScoringConfigResponses = (config: ScoringConfig): ScoringConfig => ({
  ...config,
  scales: (config.scales ?? []).map((scale) => ({
    ...scale,
    items: (scale.items ?? []).map((item) => ({
      ...item,
      scoredResponse: normalizeAnswerValue(item.scoredResponse) ?? item.scoredResponse,
    })),
  })),
});

export const normalizeAnswers = (answers: Record<string, unknown> = {}) => Object.fromEntries(
  Object.entries(answers)
    .map(([key, value]) => [key, normalizeAnswerValue(value)] as const)
    .filter((entry): entry is readonly [string, AnswerValue] => entry[1] !== undefined),
);

export const normalizeSessionAnswers = (session: CurrentSession): CurrentSession => ({
  ...session,
  answers: normalizeAnswers(session.answers),
});

export const normalizeResultAnswers = (result: AssessmentResult): AssessmentResult => ({
  ...result,
  answers: normalizeAnswers(result.answers),
});

export const findLegacyResponsePaths = (value: unknown, path = 'data', out: string[] = []): string[] => {
  if (hasLegacyAnswerValue(value)) out.push(path);
  if (Array.isArray(value)) {
    value.forEach((item, index) => findLegacyResponsePaths(item, `${path}[${index}]`, out));
  } else if (value && typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([key, child]) => {
      if (['answers', 'scoredResponse', 'options', 'value'].includes(key) || typeof child === 'object') findLegacyResponsePaths(child, `${path}.${key}`, out);
    });
  }
  return out;
};
