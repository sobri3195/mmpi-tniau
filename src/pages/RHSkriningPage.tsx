import { useEffect, useMemo, useState } from 'react';
import type { AssessmentResult, RHForm } from '../types';
import { Button, Card } from '../components/ui';
import { RHConsentStep } from '../components/rh/RHConsentStep';
import { RHIdentityStep } from '../components/rh/RHIdentityStep';
import { RHHealthHistoryStep } from '../components/rh/RHHealthHistoryStep';
import { RHEducationStep } from '../components/rh/RHEducationStep';
import { RHWorkStep } from '../components/rh/RHWorkStep';
import { RHFamilyStep } from '../components/rh/RHFamilyStep';
import { RHSocialStep } from '../components/rh/RHSocialStep';
import { RHReviewSubmitStep } from '../components/rh/RHReviewSubmitStep';
import { RHProgress } from '../components/rh/RHProgress';
import { createRHForm, ensureRHFormShape } from '../utils/rhForm';
import { validateRHForm } from '../utils/rhValidation';
import { getRHRiskFlags, getRHSummary } from '../utils/rhRedFlags';
import { getRHFormByResultId, saveCurrentSession, saveResult, saveRHForm } from '../utils/storage';
import { buildSummaryAnalysis, loadSummaryAnalysisConfig } from '../utils/summaryAnalysis';
import { markTokenCompleted } from '../utils/tokenAccess';

const steps = ['Surat Pernyataan', 'Identitas', 'Riwayat Kesehatan', 'Pendidikan', 'Pekerjaan', 'Keluarga', 'Sosial', 'Review & Submit'] as const;
const sectionByStep = ['consent', 'identity', 'health', 'education', 'work', 'family', 'social', 'review'] as const;

export const RHSkriningPage = ({ result, onDone, onCancel }: { result: AssessmentResult; onDone: (result: AssessmentResult) => void; onCancel?: () => void }) => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<RHForm>(() => ensureRHFormShape(getRHFormByResultId(result.id) || createRHForm(result), result));
  const validation = useMemo(() => validateRHForm(form), [form]);
  const currentComplete = sectionByStep[step] === 'review' ? validation.complete : validation.sectionMissing[sectionByStep[step]].length === 0;
  useEffect(() => { const now = new Date().toISOString(); saveRHForm({ ...form, status: 'draft', riskFlags: getRHRiskFlags(form) }); saveCurrentSession({ id: result.id, sessionId: result.id, tokenId: form.tokenId || undefined, participant: result.identity, identity: result.identity, answers: result.answers, currentIndex: result.answeredCount, mode: 'single', status: 'rh_in_progress', mmpiStatus: 'mmpi_completed_pending_rh', rhStatus: 'in_progress', startedAt: result.startedAt, submittedAt: result.submittedAt, rhStartedAt: form.createdAt, lastSavedAt: now, updatedAt: now }); }, [form, result]);
  const update = (next: RHForm) => setForm({ ...next, riskFlags: getRHRiskFlags(next) });
  const submit = () => {
    const submittedAt = new Date().toISOString();
    const completedForm = { ...form, submittedAt, status: 'completed' as const, riskFlags: getRHRiskFlags(form) };
    const rhSummary = getRHSummary(completedForm);
    const completedResult: AssessmentResult = { ...result, assessment: result.assessment ? { ...result.assessment, status: 'completed' } : result.assessment, rhFormId: completedForm.rhFormId, rhCompleted: true, rhSummary };
    completedResult.summaryAnalysis = buildSummaryAnalysis(completedResult, loadSummaryAnalysisConfig());
    saveRHForm(completedForm); saveResult(completedResult); if (form.tokenId) markTokenCompleted(form.tokenId, result.id); saveCurrentSession({ id: result.id, sessionId: result.id, tokenId: form.tokenId || undefined, participant: result.identity, identity: result.identity, answers: result.answers, currentIndex: result.answeredCount, mode: 'single', status: 'completed', mmpiStatus: 'completed', rhStatus: 'completed', startedAt: result.startedAt, submittedAt: result.submittedAt, rhStartedAt: form.createdAt, rhSubmittedAt: submittedAt, lastSavedAt: submittedAt, updatedAt: submittedAt }); onDone(completedResult);
  };
  return <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8"><Card className="mb-6"><p className="text-sm font-bold uppercase tracking-wide text-teal-700">Daftar Isian Riwayat Kesehatan</p><h1 className="text-3xl font-black">Kesehatan Jiwa TNI Angkatan Udara</h1><p className="mt-2 text-slate-600 dark:text-slate-300">Hasil MMPI tersimpan dengan status pending RH. Laporan baru dapat dibuka setelah Surat Pernyataan dan RH Skrining lengkap.</p><div className="mt-5"><RHProgress validation={validation} /></div></Card><div className="mb-6 grid gap-2 md:grid-cols-4 lg:grid-cols-8 no-print">{steps.map((label, index) => <button key={label} className={`rounded-2xl px-3 py-2 text-xs font-bold ${step === index ? 'bg-teal-600 text-white' : 'bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700'}`} onClick={() => setStep(index)}>{index + 1}. {label}</button>)}</div><Card><h2 className="mb-4 text-xl font-black">{steps[step]}</h2>{step === 0 && <RHConsentStep form={form} onChange={update} />}{step === 1 && <RHIdentityStep form={form} onChange={update} />}{step === 2 && <RHHealthHistoryStep form={form} onChange={update} />}{step === 3 && <RHEducationStep form={form} onChange={update} />}{step === 4 && <RHWorkStep form={form} onChange={update} />}{step === 5 && <RHFamilyStep form={form} onChange={update} />}{step === 6 && <RHSocialStep form={form} onChange={update} />}{step === 7 && <RHReviewSubmitStep form={form} validation={validation} onSubmit={submit} />}<div className="mt-6 flex flex-wrap gap-3 no-print"><Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>Kembali ke bagian sebelumnya</Button><Button variant="secondary" onClick={() => saveRHForm({ ...form, riskFlags: getRHRiskFlags(form) })}>Simpan Sementara</Button>{step < steps.length - 1 && <Button disabled={!currentComplete} onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}>Berikutnya</Button>}{onCancel && <Button variant="ghost" onClick={onCancel}>Keluar</Button>}</div></Card></div>;
};
