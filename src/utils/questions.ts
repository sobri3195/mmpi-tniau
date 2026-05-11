import type { Question } from '../types';

const asNumber = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

export const questionNumber = (question: Question, index: number) => asNumber(question.number) ?? asNumber(question.order) ?? index + 1;
export const questionNumberPadded = (question: Question, index: number) => String(questionNumber(question, index)).padStart(3, '0');

export const normalizeQuestions = (questions: Question[]): Question[] => questions.map((question, index) => {
  const number = questionNumber(question, index);
  return {
    ...question,
    id: Number(question.id),
    number,
    order: number,
    code: question.code || `Q${String(number).padStart(3, '0')}`,
  };
});

export const orderQuestionsForSession = (questions: Question[], questionOrder?: number[]) => {
  const normalized = normalizeQuestions(questions);
  if (!questionOrder?.length) return normalized;
  const byId = new Map(normalized.map((question) => [question.id, question]));
  const ordered = questionOrder.map((id) => byId.get(id)).filter((question): question is Question => Boolean(question));
  const remaining = normalized.filter((question) => !questionOrder.includes(question.id));
  return [...ordered, ...remaining];
};
