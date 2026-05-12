import type { TestAccessibilitySettings } from '../utils/storage';
import { Button } from './ui';

const FONT_SIZE_OPTIONS: Array<{ value: TestAccessibilitySettings['fontSize']; label: string; description: string }> = [
  { value: 'normal', label: 'Normal', description: 'Ukuran besar standar untuk membaca soal panjang.' },
  { value: 'large', label: 'Besar', description: 'Teks soal dan tombol dibuat lebih lega.' },
  { value: 'extra_large', label: 'Sangat Besar', description: 'Teks soal minimal 30px dan tombol jawaban maksimal.' },
];

export const AccessibilityControls = ({
  settings,
  onChange,
  focusMode,
  onToggleFocusMode,
}: {
  settings: TestAccessibilitySettings;
  onChange: (settings: TestAccessibilitySettings) => void;
  focusMode: boolean;
  onToggleFocusMode: () => void;
}) => (
  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="text-lg font-black text-slate-900 dark:text-slate-50">Ukuran Teks</h2>
        <p className="mt-1 text-base text-slate-600 dark:text-slate-300">Pilih ukuran yang paling nyaman untuk membaca 567 soal.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {FONT_SIZE_OPTIONS.map((option) => {
          const selected = settings.fontSize === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              title={option.description}
              onClick={() => onChange({ ...settings, fontSize: option.value })}
              className={`min-h-12 rounded-2xl border-2 px-4 py-2 text-base font-black transition focus:outline-none focus:ring-4 focus:ring-teal-200 dark:focus:ring-teal-900 ${selected ? 'border-teal-600 bg-teal-600 text-white shadow-md' : 'border-slate-200 bg-white text-slate-800 hover:border-teal-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap">
      <Button variant="ghost" className="min-h-12 text-base" onClick={() => onChange({ ...settings, highContrast: !settings.highContrast })}>
        Kontras tinggi: {settings.highContrast ? 'ON' : 'OFF'}
      </Button>
      <Button variant="ghost" className="min-h-12 text-base" onClick={onToggleFocusMode}>
        Fokus satu soal: {focusMode ? 'ON' : 'OFF'}
      </Button>
    </div>
  </div>
);
