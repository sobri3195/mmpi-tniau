import type { AnswerValue, QuestionOption } from '../types';
import type { TestAccessibilitySettings } from '../utils/storage';

const symbolTextClasses: Record<TestAccessibilitySettings['fontSize'], string> = {
  normal: 'text-5xl',
  large: 'text-6xl',
  extra_large: 'text-6xl sm:text-7xl',
};

const buttonSizeClasses: Record<TestAccessibilitySettings['fontSize'], string> = {
  normal: 'min-h-16 sm:min-h-20 px-6 py-5',
  large: 'min-h-20 sm:min-h-24 px-7 py-6',
  extra_large: 'min-h-24 sm:min-h-28 px-8 py-7',
};

export const AnswerButton = ({
  option,
  selected,
  settings,
  onSelect,
}: {
  option: QuestionOption;
  selected: boolean;
  settings: TestAccessibilitySettings;
  onSelect: (value: AnswerValue) => void;
}) => (
  <button
    type="button"
    aria-pressed={selected}
    onClick={() => onSelect(option.value)}
    className={`group flex w-full items-center justify-between gap-4 rounded-3xl border-2 text-left font-bold shadow-sm transition focus:outline-none focus:ring-4 focus:ring-teal-200 dark:focus:ring-teal-900 ${buttonSizeClasses[settings.fontSize]} ${selected ? 'border-teal-700 bg-teal-50 text-teal-900 ring-4 ring-teal-200 dark:border-teal-300 dark:bg-teal-950 dark:text-teal-50 dark:ring-teal-900' : 'border-slate-300 bg-white text-slate-900 hover:border-teal-500 hover:bg-teal-50/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:hover:border-teal-400 dark:hover:bg-teal-950/60'}`}
  >
    <span className={`leading-none ${symbolTextClasses[settings.fontSize]} font-black`} aria-hidden="true">{option.label}</span>
    <span className="flex flex-col items-end gap-1">
      <span className="text-base font-black sm:text-lg">Jawaban {option.value}</span>
      {selected && <span className="rounded-full bg-teal-700 px-3 py-1 text-base font-black text-white dark:bg-teal-300 dark:text-teal-950">✓ Dipilih</span>}
    </span>
  </button>
);
