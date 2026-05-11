import { useMemo, useState } from 'react';
import type { AssessmentResult } from '../types';
import { Button, Card, Select } from '../components/ui';
import { RHReviewPage } from './RHReviewPage';
import { loadRHForms } from '../utils/storage';
import { RHRedFlagBadge } from '../components/rh/RHRedFlagBadge';

export const AdminRHPage = ({ results }: { results: AssessmentResult[] }) => {
  const forms = loadRHForms();
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<string>('');
  const rows = useMemo(() => results.map((result) => ({ result, form: forms.find((form) => form.resultId === result.id) || null })).filter((row) => !filter || (filter === 'incomplete' ? !row.form || row.form.status !== 'completed' : row.form?.riskFlags.length)), [forms, filter, results]);
  const detail = selected ? rows.find((row) => row.result.id === selected) : null;
  if (detail) return <RHReviewPage result={detail.result} form={detail.form} goBack={() => setSelected('')} />;
  return <div className="space-y-6"><Card><h1 className="text-2xl font-black">Admin RH Skrining</h1><p className="text-sm text-slate-500">Melihat RH peserta, export JSON/CSV, print RH, dan cetak laporan gabungan MMPI + RH.</p><div className="mt-4 max-w-sm"><Select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="">Semua peserta</option><option value="incomplete">RH belum selesai</option><option value="redflag">Ada red flag RH</option></Select></div></Card><Card><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="p-2">Nama</th><th className="p-2">Status MMPI</th><th className="p-2">Status RH</th><th className="p-2">Ada red flag RH</th><th className="p-2">RH selesai pada</th><th className="p-2">Perlu review spesialis</th><th className="p-2">Aksi</th></tr></thead><tbody>{rows.map(({ result, form }) => <tr key={result.id} className="border-t"><td className="p-2 font-bold">{result.identity.name}</td><td className="p-2">{result.assessment?.status ?? result.status}</td><td className="p-2">{form?.status ?? 'belum ada'}</td><td className="p-2"><RHRedFlagBadge form={form} /></td><td className="p-2">{form?.submittedAt ? new Date(form.submittedAt).toLocaleString('id-ID') : '-'}</td><td className="p-2">{result.rhSummary?.needsSpecialistReview ? 'Ya' : 'Tidak'}</td><td className="p-2"><Button onClick={() => setSelected(result.id)}>Lihat RH</Button></td></tr>)}</tbody></table></div></Card></div>;
};
