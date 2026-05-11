import type { ReactNode } from 'react';
import { Badge, Button, Card } from '../ui';
import { downloadFile } from '../../utils/export';
import type { ValidationResult } from '../../utils/configValidation';

export const AlertBox = ({ children, tone = 'amber' }: { children: ReactNode; tone?: 'amber' | 'rose' | 'teal' | 'sky' }) => {
  const styles = {
    amber: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100',
    rose: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100',
    teal: 'border-teal-200 bg-teal-50 text-teal-900 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-100',
    sky: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100',
  };
  return <div className={`rounded-2xl border p-4 text-sm ${styles[tone]}`}>{children}</div>;
};

export const EmptyState = ({ title, children }: { title: string; children?: ReactNode }) => <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700"><p className="font-bold text-slate-700 dark:text-slate-200">{title}</p>{children && <div className="mt-2">{children}</div>}</div>;

export const ValidationMessages = ({ result }: { result?: ValidationResult | null }) => !result ? null : <div className="space-y-2">
  {result.errors.map((error) => <AlertBox key={error} tone="rose">{error}</AlertBox>)}
  {result.warnings.map((warning) => <AlertBox key={warning} tone="amber">{warning}</AlertBox>)}
  {result.valid && !result.warnings.length && <AlertBox tone="teal">Validasi berhasil.</AlertBox>}
</div>;

export const TemplateButton = ({ filename, data }: { filename: string; data: unknown }) => <Button type="button" variant="ghost" onClick={() => downloadFile(filename, JSON.stringify(data, null, 2))}>Unduh {filename}</Button>;

export const PanelTitle = ({ title, subtitle, status }: { title: string; subtitle: string; status?: ReactNode }) => <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-xl font-black">{title}</h2><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div>{status}</div>;

export const StatCard = ({ label, value, tone = 'slate' }: { label: string; value: ReactNode; tone?: 'teal' | 'amber' | 'rose' | 'slate' }) => <Card className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div><Badge tone={tone}>{tone === 'teal' ? 'Siap' : tone === 'rose' ? 'Belum' : tone === 'amber' ? 'Telaah' : 'Info'}</Badge></div></Card>;
