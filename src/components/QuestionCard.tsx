import type { AnswerValue, Question } from '../types';
import { questionNumber, questionNumberPadded } from '../utils/questions';
import type { TestAccessibilitySettings } from '../utils/storage';
import { AnswerButton } from './AnswerButton';
import { Badge } from './ui';

const questionTextClasses: Record<TestAccessibilitySettings['fontSize'], string> = {
  normal: 'text-xl leading-relaxed sm:text-2xl sm:leading-relaxed',
  large: 'text-2xl leading-relaxed sm:text-[28px] sm:leading-[1.65]',
  extra_large: 'text-[30px] leading-[1.65] sm:text-[34px] sm:leading-[1.7]',
};

export const QuestionCard = ({
  question,
  index,
  totalQuestions,
  selectedAnswer,
  settings,
  onAnswer,
}: {
  question: Question;
  index: number;
  totalQuestions: number;
  selectedAnswer?: AnswerValue;
  settings: TestAccessibilitySettings;
  onAnswer: (id: number, value: AnswerValue) => void;
}) => {
  const displayNumber = questionNumber(question, index);
  const paddedNumber = questionNumberPadded(question, index);

  return (
    <article className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <Badge>Soal {displayNumber} dari {totalQuestions}</Badge>
          <span className="inline-flex rounded-2xl bg-amber-50 px-4 py-2 text-xl font-black text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-800 sm:text-2xl">
            Nomor soal: {paddedNumber}
          </span>
        </div>
        <span className="font-mono text-base font-semibold text-slate-500 dark:text-slate-400">{question.code}</span>
      </div>
      <p className={`mt-6 font-medium text-slate-950 dark:text-slate-50 ${questionTextClasses[settings.fontSize]}`}>{question.text}</p>
      <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
        {question.options.map((option) => (
          <AnswerButton
            key={option.value}
            option={option}
            selected={selectedAnswer === option.value}
            settings={settings}
            onSelect={(value) => onAnswer(question.id, value)}
          />
        ))}
      </div>
    </article>
  );
};
