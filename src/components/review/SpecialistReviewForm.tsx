import { useState } from 'react';
import type { AssessmentResult, SpecialistReview, SpecialistReviewStatus } from '../../types';
import { Button, Card, Select } from '../ui';
import { AlertBox } from '../admin/AdminCommon';
import { ensureSpecialistReview, finalizeSpecialistReview, unlockReportBySuperadmin, updateSpecialistReview } from '../../utils/specialistReview';
import { getCurrentUser } from '../../utils/session';
import { FinalReportSignature } from './FinalReportSignature';

const statuses: { value: SpecialistReviewStatus; label: string }[] = [
  { value: 'pending', label: 'Perlu Review' },
  { value: 'reviewed', label: 'Sudah Direview' },
  { value: 'retest_required', label: 'Perlu Retest' },
  { value: 'interview_required', label: 'Perlu Wawancara Klinis' },
  { value: 'referred', label: 'Perlu Rujukan' },
  { value: 'finalized', label: 'Finalized' },
];
const fieldClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-teal-950';

export const SpecialistReviewForm = ({ result, onChanged }: { result: AssessmentResult; onChanged: () => void }) => {
  const user = getCurrentUser();
  const initial = ensureSpecialistReview(result);
  const [form, setForm] = useState<SpecialistReview>(initial);
  const [message, setMessage] = useState<{ tone: 'teal' | 'rose' | 'amber'; text: string } | null>(null);
  const locked = form.isLocked && user?.role !== 'superadmin';
  const save = (finalize = false) => {
    setMessage(null);
    try {
      const updated = finalize ? finalizeSpecialistReview(result.id, form) : updateSpecialistReview(result.id, form);
      setForm(ensureSpecialistReview(updated));
      setMessage({ tone: 'teal', text: finalize ? 'Laporan berhasil difinalisasi dan dikunci.' : 'Review tersimpan.' });
      onChanged();
    } catch (err) { setMessage({ tone: 'rose', text: err instanceof Error ? err.message : 'Gagal menyimpan review.' }); }
  };
  const unlock = () => {
    try { const updated = unlockReportBySuperadmin(result.id); setForm(ensureSpecialistReview(updated)); setMessage({ tone: 'amber', text: 'Kunci laporan dibuka oleh Superadmin.' }); onChanged(); } catch (err) { setMessage({ tone: 'rose', text: err instanceof Error ? err.message : 'Gagal membuka kunci.' }); }
  };
  return <div className="space-y-5"><Card><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-wide text-teal-700">Final Report Editor</p><h3 className="text-xl font-black">Review Spesialis</h3><p className="text-sm text-slate-500">Status: {statuses.find((item) => item.value === form.status)?.label ?? form.status}</p></div>{form.isLocked && <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">Terkunci</span>}</div>{locked && <div className="mt-4"><AlertBox tone="amber">Laporan sudah dikunci dan tidak bisa diedit. Superadmin dapat membuka kunci.</AlertBox></div>}<div className="mt-5 grid gap-4"><label className="text-sm font-bold">Status Review<Select disabled={locked} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as SpecialistReviewStatus })}>{statuses.filter((item) => item.value !== 'finalized').map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select></label><label className="text-sm font-bold">Catatan validitas<textarea disabled={locked} className={fieldClass} rows={3} value={form.validityNotes} onChange={(e) => setForm({ ...form, validityNotes: e.target.value })} /></label><label className="text-sm font-bold">Kesan klinis awal<textarea disabled={locked} className={fieldClass} rows={3} value={form.clinicalImpression} onChange={(e) => setForm({ ...form, clinicalImpression: e.target.value })} /></label><label className="text-sm font-bold">Catatan risiko<textarea disabled={locked} className={fieldClass} rows={3} value={form.riskNotes} onChange={(e) => setForm({ ...form, riskNotes: e.target.value })} /></label><label className="text-sm font-bold">Rekomendasi tindak lanjut<textarea disabled={locked} className={fieldClass} rows={3} value={form.recommendations} onChange={(e) => setForm({ ...form, recommendations: e.target.value })} /></label><label className="text-sm font-bold">Catatan keterbatasan<textarea disabled={locked} className={fieldClass} rows={3} value={form.limitations} onChange={(e) => setForm({ ...form, limitations: e.target.value })} /></label><label className="text-sm font-bold">Kesimpulan final<textarea disabled={locked} className={fieldClass} rows={3} value={form.finalConclusion} onChange={(e) => setForm({ ...form, finalConclusion: e.target.value })} /></label></div>{message && <div className="mt-4"><AlertBox tone={message.tone}>{message.text}</AlertBox></div>}<div className="mt-5 flex flex-wrap gap-3"><Button disabled={locked} onClick={() => save(false)}>Simpan Review</Button><Button variant="secondary" disabled={locked} onClick={() => save(true)}>Finalisasi Laporan</Button>{user?.role === 'superadmin' && form.isLocked && <Button variant="ghost" onClick={unlock}>Buka Kunci</Button>}</div></Card><FinalReportSignature review={form} /></div>;
};
