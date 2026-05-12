import type { AnswerValue, Question } from '../types';
import { isAnswerValue } from '../utils/answerFormat';
import { questionNumber, questionNumberPadded } from '../utils/questions';

export const QuestionNavigator = ({
  questions,
  answers,
  currentIndex,
  canOpenQuestion,
  onGoToQuestion,
}: {
  questions: Question[];
  answers: Record<string, AnswerValue>;
  currentIndex: number;
  canOpenQuestion: (index: number) => boolean;
  onGoToQuestion: (index: number) => void;
}) => (
  <div className="mt-5 flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible sm:pb-0">
    {questions.map((question, index) => {
      const answered = isAnswerValue(answers[String(question.id)]);
      const active = index === currentIndex;
      const open = canOpenQuestion(index);
      return (
        <button
          key={question.id}
          type="button"
          title={`Nomor soal: ${questionNumberPadded(question, index)}`}
          onClick={() => onGoToQuestion(index)}
          aria-disabled={!open}
          aria-label={`Soal ${questionNumber(question, index)} dari ${questions.length}, nomor soal ${questionNumberPadded(question, index)}${active ? ', aktif' : ''}${answered ? ', sudah dijawab' : ', belum dijawab'}`}
          className={`min-h-11 min-w-11 shrink-0 rounded-2xl border-2 px-3 text-base font-black transition focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900 ${answered ? 'border-teal-700 bg-teal-600 text-white' : 'border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'} ${active ? 'ring-4 ring-blue-500' : ''} ${!open ? 'cursor-not-allowed opacity-45' : 'hover:border-blue-500'}`}
        >
          {questionNumberPadded(question, index)}
        </button>
      );
    })}
  </div>
);
