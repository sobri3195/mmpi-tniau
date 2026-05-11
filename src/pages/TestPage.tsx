import { useMemo, useState } from 'react';
import type { AnswerValue, CurrentSession, Question } from '../types';
import { Button, Card, Badge } from '../components/ui';
import { saveCurrentSession } from '../utils/storage';
import { questionNumber, questionNumberPadded } from '../utils/questions';
import { isAnswerValue, REQUIRED_TOTAL_QUESTIONS } from '../utils/answerFormat';

export const TestPage = ({ session, questions, hasScoringConfig, onSubmit, onExit, onChange }: { session: CurrentSession; questions: Question[]; hasScoringConfig: boolean; onSubmit: (s: CurrentSession) => void; onExit: () => void; onChange: (s: CurrentSession) => void }) => {
  const [local, setLocal] = useState(session);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const answered = Object.values(local.answers).filter(isAnswerValue).length;
  const progress = questions.length ? Math.round((answered / questions.length) * 100) : 0;
  const question = questions[local.currentIndex];
  const isAnswered = (q: Question) => isAnswerValue(local.answers[String(q.id)]);
  const missing = useMemo(() => questions.map((q, index) => ({ q, index })).filter(({ q }) => !isAnswered(q)), [questions, local.answers]);
  const firstMissingIndex = missing[0]?.index ?? questions.length;
  const currentAnswered = question ? isAnswered(question) : false;
  const canOpenQuestion = (index: number) => index <= firstMissingIndex;
  const visibleQuestions = questions.slice(0, Math.min(questions.length, firstMissingIndex + 1));
  const update = (patch: Partial<CurrentSession>) => {
    const next = { ...local, ...patch, updatedAt: new Date().toISOString() };
    setLocal(next); saveCurrentSession(next); onChange(next);
  };
  const showRequiredNotice = (index = local.currentIndex) => {
    const target = questions[index];
    setNotice(`Wajib jawab dulu soal nomor ${target ? questionNumberPadded(target, index) : String(index + 1).padStart(3, '0')} sebelum melanjutkan.`);
  };
  const goToQuestion = (index: number) => {
    if (!canOpenQuestion(index)) {
      showRequiredNotice(firstMissingIndex);
      update({ currentIndex: firstMissingIndex });
      return;
    }
    setNotice('');
    update({ currentIndex: index });
  };
  const answer = (id: number, value: AnswerValue) => {
    if (!isAnswerValue(value)) return;
    setNotice('Jawaban otomatis tersimpan di perangkat ini.');
    update({ answers: { ...local.answers, [String(id)]: value } });
  };
  const nextQuestion = () => {
    if (!question || local.currentIndex >= questions.length - 1) return;
    if (!currentAnswered) {
      showRequiredNotice();
      return;
    }
    setNotice('');
    update({ currentIndex: Math.min(questions.length - 1, local.currentIndex + 1) });
  };
  const submit = () => {
    if (questions.length !== REQUIRED_TOTAL_QUESTIONS) {
      setNotice(`Belum bisa submit. Bank soal harus berisi ${REQUIRED_TOTAL_QUESTIONS} soal; saat ini ${questions.length}.`);
      return;
    }
    const unanswered = questions.slice(0, REQUIRED_TOTAL_QUESTIONS).map((q, index) => ({ q, index })).filter(({ q }) => !isAnswered(q));
    if (unanswered.length > 0) {
      const firstUnanswered = unanswered[0].index;
      const numbers = unanswered.map(({ q, index }) => questionNumberPadded(q, index)).join(', ');
      setNotice(`Belum bisa submit. ${unanswered.length} dari ${questions.length} soal belum dijawab. Nomor soal kosong: ${numbers}.`);
      update({ currentIndex: firstUnanswered, mode: 'single' });
      return;
    }
    setIsSubmitting(true);
    setNotice('');
    setTimeout(() => { onSubmit(local); setIsSubmitting(false); }, 0);
  };
  const renderQuestion = (q: Question, index: number) => {
    const displayNumber = questionNumber(q, index);
    const paddedNumber = questionNumberPadded(q, index);
    return (
    <div key={q.id} className="rounded-2xl border border-slate-200 p-4 sm:rounded-3xl sm:p-5 dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2"><Badge>Soal {displayNumber} dari {questions.length}</Badge><Badge tone="amber">Nomor soal: {paddedNumber}</Badge></div><span className="font-mono text-xs text-slate-500">{q.code}</span></div>
      <p className="mt-4 text-base font-semibold leading-7 sm:text-lg">{q.text}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {q.options.map((opt) => <button key={String(opt.value)} onClick={() => answer(q.id, opt.value)} className={`min-h-14 rounded-2xl border p-4 text-left font-bold transition ${local.answers[String(q.id)] === opt.value ? 'border-teal-500 bg-teal-50 text-teal-800 ring-4 ring-teal-100 dark:bg-teal-950 dark:text-teal-100 dark:ring-teal-900' : 'border-slate-200 hover:border-teal-300 dark:border-slate-700'}`}>{opt.label}</button>)}
      </div>
    </div>
    );
  };
  if (!questions.length) return <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10"><Card><h1 className="text-2xl font-black">Bank soal belum tersedia</h1><p className="mt-2">Admin harus mengimpor bank soal JSON/CSV resmi/berizin atau memuat data demo untuk pengujian.</p><Button className="mt-4" onClick={onExit}>Kembali</Button></Card></div>;
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <Card className="mb-6 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-black">Tes berlangsung</h1><p className="text-sm text-slate-500">Autosave aktif • {answered}/{questions.length} terjawab • Soal aktif {question ? questionNumberPadded(question, local.currentIndex) : '-'}</p></div><Badge tone="amber">Draft</Badge></div>
        <div className="mt-4 h-3 rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-3 rounded-full bg-teal-500" style={{ width: `${progress}%` }} /></div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-slate-500"><span>Ring biru: soal aktif</span><span>Hijau: sudah dijawab</span><span>Abu-abu: belum dijawab</span><span>Redup: belum bisa dibuka</span></div><div className="mt-4 flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible sm:pb-0">{questions.map((q, i) => <button key={q.id} title={`Nomor soal: ${questionNumberPadded(q, i)}`} onClick={() => goToQuestion(i)} aria-disabled={!canOpenQuestion(i)} aria-label={`Soal ${questionNumber(q, i)} dari ${questions.length}, nomor soal ${questionNumberPadded(q, i)}${i === local.currentIndex ? ', aktif' : ''}${isAnswerValue(local.answers[String(q.id)]) ? ', sudah dijawab' : ', belum dijawab'}`} className={`h-11 min-w-11 shrink-0 rounded-xl px-2 text-xs font-black ${isAnswerValue(local.answers[String(q.id)]) ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800'} ${i === local.currentIndex ? 'ring-4 ring-blue-500' : ''} ${!canOpenQuestion(i) ? 'cursor-not-allowed opacity-45' : ''}`}>{questionNumberPadded(q, i)}</button>)}</div>
        {!hasScoringConfig && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">Tes dapat dikerjakan, tetapi hasil belum dapat dihitung sebelum admin mengimpor konfigurasi scoring.</div>}
        <div className="mt-4 grid gap-3 sm:flex sm:flex-wrap"><Button variant="ghost" onClick={() => update({ mode: local.mode === 'single' ? 'list' : 'single' })}>Mode: {local.mode === 'single' ? 'Satu soal' : 'Daftar'}</Button><Button variant="ghost" onClick={onExit}>Simpan & lanjutkan nanti</Button></div>
      </Card>
      <Card>
        {local.mode === 'single' ? renderQuestion(question, local.currentIndex) : <div className="space-y-4">{visibleQuestions.map((q, index) => renderQuestion(q, index))}</div>}
        {notice && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">{notice}</div>}
        <div className="mt-6 grid gap-3 no-print sm:flex sm:flex-wrap sm:justify-between">
          <Button variant="ghost" disabled={local.currentIndex === 0} onClick={() => goToQuestion(Math.max(0, local.currentIndex - 1))}>Sebelumnya</Button>
          <div className="grid gap-3 sm:flex"><Button variant="ghost" disabled={local.currentIndex === questions.length - 1 || !currentAnswered} aria-disabled={!currentAnswered} className={!currentAnswered ? 'opacity-50' : ''} onClick={nextQuestion}>Berikutnya</Button><Button disabled={isSubmitting} onClick={submit}>{isSubmitting ? 'Memproses...' : 'Kirim hasil'}</Button></div>
        </div>
        {missing.length > 0 && <p className="mt-4 text-sm font-semibold text-amber-700">Belum bisa submit: {missing.length} dari {questions.length} soal belum dijawab. Daftar nomor soal belum dijawab: {missing.slice(0, 30).map(({ q, index }) => questionNumberPadded(q, index)).join(', ')}{missing.length > 30 ? ' ...' : ''}</p>}
      </Card>
    </div>
  );
};
