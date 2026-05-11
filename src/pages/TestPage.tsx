import { useMemo, useState } from 'react';
import type { AnswerValue, CurrentSession, Question } from '../types';
import { Button, Card, Badge } from '../components/ui';
import { saveCurrentSession } from '../utils/storage';

export const TestPage = ({ session, questions, hasScoringConfig, onSubmit, onExit, onChange }: { session: CurrentSession; questions: Question[]; hasScoringConfig: boolean; onSubmit: (s: CurrentSession) => void; onExit: () => void; onChange: (s: CurrentSession) => void }) => {
  const [local, setLocal] = useState(session);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const answered = Object.keys(local.answers).length;
  const progress = questions.length ? Math.round((answered / questions.length) * 100) : 0;
  const question = questions[local.currentIndex];
  const missing = useMemo(() => questions.filter((q) => q.required && local.answers[String(q.id)] === undefined), [questions, local.answers]);
  const update = (patch: Partial<CurrentSession>) => {
    const next = { ...local, ...patch, updatedAt: new Date().toISOString() };
    setLocal(next); saveCurrentSession(next); onChange(next);
  };
  const answer = (id: number, value: AnswerValue) => update({ answers: { ...local.answers, [String(id)]: value } });
  const renderQuestion = (q: Question, index: number) => (
    <div key={q.id} className="rounded-2xl border border-slate-200 p-4 sm:rounded-3xl sm:p-5 dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3"><Badge>Soal {index + 1} / {questions.length}</Badge><span className="font-mono text-xs text-slate-500">{q.code}</span></div>
      <p className="mt-4 text-base font-semibold leading-7 sm:text-lg">{q.text}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {q.options.map((opt) => <button key={String(opt.value)} onClick={() => answer(q.id, opt.value)} className={`min-h-14 rounded-2xl border p-4 text-left font-bold transition ${local.answers[String(q.id)] === opt.value ? 'border-teal-500 bg-teal-50 text-teal-800 ring-4 ring-teal-100 dark:bg-teal-950 dark:text-teal-100 dark:ring-teal-900' : 'border-slate-200 hover:border-teal-300 dark:border-slate-700'}`}>{opt.label}</button>)}
      </div>
    </div>
  );
  if (!questions.length) return <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10"><Card><h1 className="text-2xl font-black">Bank soal belum tersedia</h1><p className="mt-2">Admin harus mengimport bank soal JSON/CSV resmi/berizin atau memuat dummy demo untuk pengujian.</p><Button className="mt-4" onClick={onExit}>Kembali</Button></Card></div>;
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <Card className="mb-6 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-black">Tes Berlangsung</h1><p className="text-sm text-slate-500">Autosave aktif • {answered}/{questions.length} terjawab</p></div><Badge tone="amber">Draft</Badge></div>
        <div className="mt-4 h-3 rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-3 rounded-full bg-teal-500" style={{ width: `${progress}%` }} /></div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible sm:pb-0">{questions.map((q, i) => <button key={q.id} onClick={() => update({ currentIndex: i })} className={`h-10 w-10 shrink-0 rounded-xl text-sm font-bold ${local.answers[String(q.id)] !== undefined ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800'} ${i === local.currentIndex ? 'ring-2 ring-blue-500' : ''}`}>{i + 1}</button>)}</div>
        {!hasScoringConfig && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">Tes dapat dikerjakan, tetapi Submit Hasil belum dapat dihitung sebelum admin mengimpor konfigurasi scoring.</div>}
        <div className="mt-4 grid gap-3 sm:flex sm:flex-wrap"><Button variant="ghost" onClick={() => update({ mode: local.mode === 'single' ? 'list' : 'single' })}>Mode: {local.mode === 'single' ? 'Satu soal' : 'Daftar'}</Button><Button variant="ghost" onClick={onExit}>Simpan & Lanjutkan Nanti</Button></div>
      </Card>
      <Card>
        {local.mode === 'single' ? renderQuestion(question, local.currentIndex) : <div className="space-y-4">{questions.map(renderQuestion)}</div>}
        <div className="mt-6 grid gap-3 no-print sm:flex sm:flex-wrap sm:justify-between">
          <Button variant="ghost" disabled={local.currentIndex === 0} onClick={() => update({ currentIndex: Math.max(0, local.currentIndex - 1) })}>Sebelumnya</Button>
          <div className="grid gap-3 sm:flex"><Button variant="ghost" disabled={local.currentIndex === questions.length - 1} onClick={() => update({ currentIndex: Math.min(questions.length - 1, local.currentIndex + 1) })}>Berikutnya</Button><Button disabled={missing.length > 0 || isSubmitting} onClick={() => { setIsSubmitting(true); setTimeout(() => { onSubmit(local); setIsSubmitting(false); }, 0); }}>{isSubmitting ? 'Memproses...' : 'Submit Hasil'}</Button></div>
        </div>
        {missing.length > 0 && <p className="mt-4 text-sm font-semibold text-amber-700">Belum bisa submit: {missing.length} soal wajib belum dijawab.</p>}
      </Card>
    </div>
  );
};
