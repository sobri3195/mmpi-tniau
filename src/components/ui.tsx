import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <section className={`print-card rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:rounded-3xl sm:p-6 ${className}`}>{children}</section>
);

export const Button = ({ children, variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }) => {
  const styles = {
    primary: 'bg-teal-600 text-white hover:bg-teal-700',
    secondary: 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
    ghost: 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700',
  };
  return <button className={`inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-2.5 text-center text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`} {...props}>{children}</button>;
};

export const Badge = ({ children, tone = 'slate' }: { children: ReactNode; tone?: 'teal' | 'amber' | 'rose' | 'slate' }) => {
  const tones = {
    teal: 'bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-950 dark:text-teal-200 dark:ring-teal-800',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-800',
    rose: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:ring-rose-800',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700',
  };
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${tones[tone]}`}>{children}</span>;
};

export const Input = (props: InputHTMLAttributes<HTMLInputElement>) => <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-teal-950" {...props} />;
export const Select = (props: SelectHTMLAttributes<HTMLSelectElement>) => <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-teal-950" {...props} />;
export const Textarea = (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-teal-950" {...props} />;

export const Disclaimer = () => (
  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm sm:p-4 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
    <strong>Disclaimer klinis:</strong> Sistem ini hanya alat administrasi dan screening internal. Hasil otomatis bukan diagnosis klinis dan wajib ditinjau psikolog, psikiater, atau konselor berwenang. Gunakan hanya bank soal, norma, dan interpretasi resmi/berizin.
  </div>
);

export const PrivacyNotice = () => null;
