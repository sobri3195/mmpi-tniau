import { useMemo, useState } from 'react';
import type { AnswerValue, CurrentSession, Question } from '../types';
import { AccessibilityControls } from '../components/AccessibilityControls';
import { QuestionCard } from '../components/QuestionCard';
import { QuestionNavigator } from '../components/QuestionNavigator';
import { Button, Card, Badge } from '../components/ui';
import { loadAccessibilitySettings, saveAccessibilitySettings, saveCurrentSession } from '../utils/storage';
import { validateParticipantAccess } from '../utils/tokenValidation';
import type { TestAccessibilitySettings } from '../utils/storage';
import { questionNumberPadded } from '../utils/questions';
import { isAnswerValue, REQUIRED_TOTAL_QUESTIONS } from '../utils/answerFormat';

export const TestPage = ({ session, questions, onSubmit, onExit, onChange, onAccessDenied }: { session: CurrentSession; questions: Question[]; onSubmit: (s: CurrentSession) => void; onExit: () => void; onChange: (s: CurrentSession) => void; onAccessDenied?: () => void }) => {
  const [local, setLocal] = useState(session);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [focusMode, setFocusMode] = useState(() => {
    try {
      return Boolean(JSON.parse(sessionStorage.getItem('sppg_mmpi2_accessibility_settings') || '{}').focusMode);
    } catch {
      return false;
    }
  });
  const [accessibility, setAccessibility] = useState<TestAccessibilitySettings>(() => loadAccessibilitySettings());
  const answered = Object.values(local.answers).filter(isAnswerValue).length;
  const progress = questions.length ? Math.round((answered / questions.length) * 100) : 0;
  const question = questions[local.currentIndex];
  const isAnswered = (q: Question) => isAnswerValue(local.answers[String(q.id)]);
  const missing = useMemo(() => questions.map((q, index) => ({ q, index })).filter(({ q }) => !isAnswered(q)), [questions, local.answers]);
  const firstMissingIndex = missing[0]?.index ?? questions.length;
  const currentAnswered = question ? isAnswered(question) : false;
  const canOpenQuestion = (index: number) => index <= firstMissingIndex;
  const visibleQuestions = focusMode
    ? (question ? [{ q: question, index: local.currentIndex }] : [])
    : questions.slice(0, Math.min(questions.length, firstMissingIndex + 1)).map((q, index) => ({ q, index }));

  const ensureAccess = () => {
    const validation = validateParticipantAccess({ session: local, currentRoute: '/test' });
    if (validation.allowed) return true;
    if (validation.reason === 'token_disabled' || validation.reason === 'paused_token_disabled') {
      const paused = { ...local, sessionStatus: 'paused_token_disabled' as const, status: 'paused_token_disabled' as const, updatedAt: new Date().toISOString() };
      saveCurrentSession(paused);
      setLocal(paused);
      onChange(paused);
      onAccessDenied?.();
      return false;
    }
    setNotice(validation.message);
    return false;
  };

  const update = (patch: Partial<CurrentSession>) => {
    if (!ensureAccess()) return;
    const next = { ...local, ...patch, updatedAt: new Date().toISOString() };
    setLocal(next);
    saveCurrentSession(next);
    onChange(next);
  };

  const updateAccessibility = (settings: TestAccessibilitySettings) => {
    setAccessibility(settings);
    saveAccessibilitySettings(settings);
  };

  const toggleFocusMode = () => {
    const next = !focusMode;
    setFocusMode(next);
    sessionStorage.setItem('sppg_mmpi2_accessibility_settings', JSON.stringify({ ...accessibility, focusMode: next }));
  };

  const showRequiredNotice = (index = local.currentIndex) => {
    const target = questions[index];
    setNotice(`Pilih + atau - terlebih dahulu. Soal nomor ${target ? questionNumberPadded(target, index) : String(index + 1).padStart(3, '0')} wajib dijawab sebelum melanjutkan.`);
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
    if (!question) return;
    if (!currentAnswered) {
      showRequiredNotice();
      return;
    }
    if (local.currentIndex >= questions.length - 1) return;
    setNotice('');
    update({ currentIndex: Math.min(questions.length - 1, local.currentIndex + 1) });
  };

  const submit = () => {
    if (!ensureAccess()) return;
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
    if (!window.confirm('Pastikan seluruh jawaban sudah sesuai. Kirim hasil final MMPI sekarang?')) return;
    setIsSubmitting(true);
    setNotice('');
    setTimeout(() => { onSubmit(local); setIsSubmitting(false); }, 0);
  };

  if (!questions.length) return <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10"><Card><h1 className="text-2xl font-black">Bank soal belum tersedia</h1><p className="mt-2 text-lg">Admin harus mengimpor bank soal JSON/CSV resmi/berizin atau memuat data demo untuk pengujian.</p><Button className="mt-4" onClick={onExit}>Kembali</Button></Card></div>;

  return (
    <div className={`mx-auto max-w-6xl px-4 py-6 sm:py-8 ${accessibility.highContrast ? 'contrast-125' : ''}`}>
      <Card className="mb-6 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black sm:text-4xl">Tes MMPI berlangsung</h1>
            <p className="mt-2 text-base font-semibold text-slate-600 dark:text-slate-300 sm:text-lg">Autosave aktif • {answered}/{questions.length} terjawab • Soal aktif {question ? questionNumberPadded(question, local.currentIndex) : '-'}</p>
          </div>
          <Badge tone="amber">Draft</Badge>
        </div>
        <div className="mt-5 h-4 rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-4 rounded-full bg-teal-500" style={{ width: `${progress}%` }} /></div>
        <div className="mt-3 flex flex-wrap gap-3 text-base font-semibold text-slate-600 dark:text-slate-300"><span>Ring biru: soal aktif</span><span>Hijau: sudah dijawab</span><span>Abu-abu: belum dijawab</span><span>Redup: belum bisa dibuka</span></div>
        <QuestionNavigator questions={questions} answers={local.answers} currentIndex={local.currentIndex} canOpenQuestion={canOpenQuestion} onGoToQuestion={goToQuestion} />
        <div className="mt-5">
          <AccessibilityControls settings={accessibility} onChange={updateAccessibility} focusMode={focusMode} onToggleFocusMode={toggleFocusMode} />
        </div>
        <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
          <Button variant="ghost" className="min-h-12 text-base" onClick={() => update({ mode: local.mode === 'single' ? 'list' : 'single' })}>Mode: {local.mode === 'single' ? 'Satu soal' : 'Daftar'}</Button>
          <Button variant="ghost" className="min-h-12 text-base" onClick={onExit}>Simpan & lanjutkan nanti</Button>
        </div>
      </Card>
      <Card>
        {local.mode === 'single' && question ? (
          <QuestionCard question={question} index={local.currentIndex} totalQuestions={questions.length} selectedAnswer={local.answers[String(question.id)]} settings={accessibility} onAnswer={answer} />
        ) : (
          <div className="space-y-6">{visibleQuestions.map(({ q, index }) => <QuestionCard key={q.id} question={q} index={index} totalQuestions={questions.length} selectedAnswer={local.answers[String(q.id)]} settings={accessibility} onAnswer={answer} />)}</div>
        )}
        {notice && <div className="mt-5 rounded-3xl border-2 border-amber-300 bg-amber-50 p-5 text-lg font-black text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-50 sm:text-xl">{notice}</div>}
        <div className="mt-7 grid gap-3 no-print sm:flex sm:flex-wrap sm:justify-between">
          <Button variant="ghost" className="min-h-12 text-base" disabled={local.currentIndex === 0} onClick={() => goToQuestion(Math.max(0, local.currentIndex - 1))}>Sebelumnya</Button>
          <div className="grid gap-3 sm:flex">
            <Button variant="ghost" aria-disabled={!currentAnswered} className={`min-h-12 text-base ${!currentAnswered ? 'opacity-60' : ''}`} onClick={nextQuestion}>Berikutnya</Button>
            <Button className="min-h-12 text-base" disabled={isSubmitting} onClick={submit}>{isSubmitting ? 'Memproses...' : 'Kirim hasil'}</Button>
          </div>
        </div>
        {missing.length > 0 && <p className="mt-5 text-base font-bold text-amber-800 dark:text-amber-200 sm:text-lg">Belum bisa submit: {missing.length} dari {questions.length} soal belum dijawab. Daftar nomor soal belum dijawab: {missing.slice(0, 30).map(({ q, index }) => questionNumberPadded(q, index)).join(', ')}{missing.length > 30 ? ' ...' : ''}</p>}
      </Card>
    </div>
  );
};
