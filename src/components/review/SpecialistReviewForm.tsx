import { useState } from 'react';
import type { AssessmentResult, SpecialistReview, SpecialistReviewStatus, ClinicalFinalizationChecklist } from '../../types';
import { Button, Card, Select } from '../ui';
import { AlertBox } from '../admin/AdminCommon';
import { ensureSpecialistReview, finalizeSpecialistReview, unlockReportBySuperadmin, updateSpecialistReview } from '../../utils/specialistReview';
import { getCurrentUser } from '../../utils/session';
import { FinalReportSignature } from './FinalReportSignature';
import { ClinicalChecklist } from './ClinicalChecklist';
import { isClinicalChecklistComplete } from './clinicalChecklistUtils';
import { DigitalSignaturePanel } from './DigitalSignaturePanel';
import { saveClinicalChecklistForResult } from '../../utils/reviewWorkflow';
import { signFinalReport, unlockFinalReportBySuperadmin } from '../../utils/finalSignature';

const statuses: { value: SpecialistReviewStatus; label: string }[] = [
  { value: 'pending', label: 'Perlu telaah' },
  { value: 'reviewed', label: 'Sudah ditelaah' },
  { value: 'retest_required', label: 'Perlu tes ulang' },
  { value: 'interview_required', label: 'Perlu wawancara klinis' },
  { value: 'referred', label: 'Perlu Rujukan' },
  { value: 'finalized', label: 'Final' },
];
const fieldClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-teal-950';

export const SpecialistReviewForm = ({ result, onChanged }: { result: AssessmentResult; onChanged: () => void }) => {
  const user = getCurrentUser();
  const initial = ensureSpecialistReview(result);
  const [form, setForm] = useState<SpecialistReview>(initial);
  const [checklist, setChecklist] = useState<ClinicalFinalizationChecklist | undefined>(result.clinicalFinalizationChecklist);
  const [message, setMessage] = useState<{ tone: 'teal' | 'rose' | 'amber'; text: string } | null>(null);
  const locked = form.isLocked && user?.role !== 'superadmin';
  const save = (finalize = false) => {
    setMessage(null);
    try {
      if (checklist) saveClinicalChecklistForResult(result.id, checklist);
      if (finalize && !isClinicalChecklistComplete(checklist)) throw new Error('Checklist validitas klinis wajib lengkap sebelum finalisasi.');
      const updated = finalize ? finalizeSpecialistReview(result.id, form) : updateSpecialistReview(result.id, form);
      if (finalize && user) signFinalReport(result.id, { userId: user.userId, username: user.username, displayName: user.displayName, role: user.role, licenseNumber: user.signature?.licenseNumber });
      setForm(ensureSpecialistReview(updated));
      setMessage({ tone: 'teal', text: finalize ? 'Laporan berhasil difinalisasi dan dikunci.' : 'Telaah tersimpan.' });
      onChanged();
    } catch (err) { setMessage({ tone: 'rose', text: err instanceof Error ? err.message : 'Gagal menyimpan telaah.' }); }
  };
  const unlock = () => {
    try { unlockFinalReportBySuperadmin(result.id, 'Pembukaan kunci dari form review'); const updated = unlockReportBySuperadmin(result.id); setForm(ensureSpecialistReview(updated)); setMessage({ tone: 'amber', text: 'Kunci laporan dibuka oleh Superadmin.' }); onChanged(); } catch (err) { setMessage({ tone: 'rose', text: err instanceof Error ? err.message : 'Gagal membuka kunci.' }); }
  };
  return <div className="space-y-5"><Card><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-wide text-teal-700">Editor laporan final</p><h3 className="text-xl font-black">Telaah spesialis</h3><p className="text-sm text-slate-500">Status: {statuses.find((item) => item.value === form.status)?.label ?? form.status}</p></div>{form.isLocked && <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">Terkunci</span>}</div>{locked && <div className="mt-4"><AlertBox tone="amber">Laporan sudah dikunci dan tidak bisa diedit. Superadmin dapat membuka kunci.</AlertBox></div>}<div className="mt-5 grid gap-4"><label className="text-sm font-bold">Status telaah<Select disabled={locked} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as SpecialistReviewStatus })}>{statuses.filter((item) => item.value !== 'finalized').map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select></label><label className="text-sm font-bold">Catatan validitas<textarea disabled={locked} className={fieldClass} rows={3} value={form.validityNotes} onChange={(e) => setForm({ ...form, validityNotes: e.target.value })} /></label><label className="text-sm font-bold">Kesan klinis awal<textarea disabled={locked} className={fieldClass} rows={3} value={form.clinicalImpression} onChange={(e) => setForm({ ...form, clinicalImpression: e.target.value })} /></label><label className="text-sm font-bold">Catatan risiko<textarea disabled={locked} className={fieldClass} rows={3} value={form.riskNotes} onChange={(e) => setForm({ ...form, riskNotes: e.target.value })} /></label><label className="text-sm font-bold">Rekomendasi tindak lanjut<textarea disabled={locked} className={fieldClass} rows={3} value={form.recommendations} onChange={(e) => setForm({ ...form, recommendations: e.target.value })} /></label><label className="text-sm font-bold">Catatan keterbatasan<textarea disabled={locked} className={fieldClass} rows={3} value={form.limitations} onChange={(e) => setForm({ ...form, limitations: e.target.value })} /></label><label className="text-sm font-bold">Kesimpulan final<textarea disabled={locked} className={fieldClass} rows={3} value={form.finalConclusion} onChange={(e) => setForm({ ...form, finalConclusion: e.target.value })} /></label></div>{message && <div className="mt-4"><AlertBox tone={message.tone}>{message.text}</AlertBox></div>}<div className="mt-5 flex flex-wrap gap-3"><Button disabled={locked} onClick={() => save(false)}>Simpan telaah</Button><Button variant="secondary" disabled={locked || !isClinicalChecklistComplete(checklist)} onClick={() => save(true)}>Finalisasi laporan</Button>{user?.role === 'superadmin' && form.isLocked && <Button variant="ghost" onClick={unlock}>Buka kunci</Button>}</div></Card><ClinicalChecklist value={checklist} completedBy={user?.displayName ?? user?.username ?? ''} onChange={setChecklist} /><DigitalSignaturePanel signature={result.finalSignature} /><FinalReportSignature review={form} /></div>;
};
