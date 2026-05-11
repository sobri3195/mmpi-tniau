import { useEffect, useState } from 'react';
import type { AssessmentResult, CurrentSession, ParticipantIdentity } from './types';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminSetupPage } from './pages/AdminSetupPage';
import { IdentityPage } from './pages/IdentityPage';
import { InstructionsPage } from './pages/InstructionsPage';
import { LandingPage } from './pages/LandingPage';
import { ResultsPage } from './pages/ResultsPage';
import { TokenAccessPage } from './pages/TokenAccessPage';
import { TestPage } from './pages/TestPage';
import { Button, Card } from './components/ui';
import { BrandLogo } from './components/BrandLogo';
import { calculateRawScores, determineValidity, generateClinicalSummary, generateInterpretations, generateRecommendations, isDemoScoringConfig, validateScoringConfig } from './utils/scoring';
import { loadCurrentSession, loadQuestions, loadResults, loadScoringConfig, saveCurrentSession, saveResult, STORAGE_KEYS } from './utils/storage';
import { markTokenCompleted, touchTokenSession, validateSessionToken } from './utils/tokenAccess';
import { hasAnyUser } from './utils/userStorage';
import { validateSession } from './utils/session';
import { writeAuditLog } from './utils/auditLog';
import { buildStartTiming, buildSubmitTiming } from './utils/time';
import { orderQuestionsForSession } from './utils/questions';
import { normalizeAnswers } from './utils/answerFormat';

export type Page = 'landing' | 'access' | 'identity' | 'instructions' | 'test' | 'result' | 'admin' | 'scoring-missing';

const newSession = (identity: ParticipantIdentity, questions: { id: number }[], existing?: CurrentSession | null): CurrentSession => {
  const startTiming = existing?.startedAt
    ? { startedAt: existing.startedAt, startedDate: existing.startedDate ?? existing.startedAt.slice(0, 10), startedTime: existing.startedTime ?? new Date(existing.startedAt).toLocaleTimeString('id-ID', { hour12: false }) }
    : buildStartTiming();
  const now = new Date().toISOString();
  return {
    id: existing?.id || crypto.randomUUID(),
    sessionId: existing?.sessionId || existing?.id || crypto.randomUUID(),
    tokenId: existing?.tokenId,
    token: existing?.token,
    uniqueKey: existing?.uniqueKey,
    participant: identity,
    identity,
    answers: normalizeAnswers(existing?.answers || {}),
    currentIndex: existing?.currentIndex || 0,
    mode: existing?.mode || 'single',
    status: 'Draft',
    ...startTiming,
    submittedAt: existing?.submittedAt,
    submittedDate: existing?.submittedDate,
    submittedTime: existing?.submittedTime,
    durationSeconds: existing?.durationSeconds ?? startTiming.durationSeconds,
    durationText: existing?.durationText ?? startTiming.durationText,
    questionOrder: existing?.questionOrder?.length ? existing.questionOrder : questions.map((question) => question.id),
    lastSavedAt: now,
    updatedAt: now,
  };
};

export default function App() {
  const routeToPage = (pathname: string): Page => {
    if (pathname.startsWith('/admin') || pathname.startsWith('/result/') || pathname.startsWith('/report/')) return 'admin';
    if (pathname === '/access') return 'access';
    if (pathname === '/participant') return validateSessionToken().valid ? 'identity' : 'access';
    if (pathname === '/test') return validateSessionToken().valid ? 'test' : 'access';
    return 'landing';
  };
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const [page, setPageState] = useState<Page>(() => routeToPage(window.location.pathname));
  const [accessMessage, setAccessMessage] = useState(() => window.location.pathname === '/test' && !validateSessionToken().valid ? 'Silakan masukkan token akses dan unique key terlebih dahulu.' : '');
  useEffect(() => {
    const onPopState = () => { setCurrentPath(window.location.pathname); setPageState(routeToPage(window.location.pathname)); };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  const navigate = (path: string) => { window.history.replaceState(null, '', path); setCurrentPath(path); setPageState(routeToPage(path)); };
  const setPage = (next: Page, path?: string) => { setPageState(next); if (path) { window.history.replaceState(null, '', path); setCurrentPath(path); } };
  const [dark, setDark] = useState(() => localStorage.getItem(STORAGE_KEYS.adminSettings)?.includes('dark'));
  const [session, setSession] = useState<CurrentSession | null>(() => loadCurrentSession());
  const [questions, setQuestions] = useState(() => loadQuestions());
  const [config, setConfig] = useState(() => loadScoringConfig());
  const [results, setResults] = useState(() => loadResults());
  const [activeResult, setActiveResult] = useState<AssessmentResult | null>(null);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', Boolean(dark));
    const currentSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.adminSettings) || '{}');
    localStorage.setItem(STORAGE_KEYS.adminSettings, JSON.stringify({ ...currentSettings, dark }));
  }, [dark]);
  const refresh = () => { setQuestions(loadQuestions()); setConfig(loadScoringConfig()); setResults(loadResults()); };
  const startIdentity = (identity: ParticipantIdentity) => { const validation = validateSessionToken(session); if (!validation.valid) { setAccessMessage(validation.message); setPage('access', '/access'); return; } const s = newSession(identity, questions, session); setSession(s); saveCurrentSession(s); touchTokenSession(s); writeAuditLog({ action: 'Participant started test', targetType: 'token', targetId: s.tokenId ?? '', description: `Peserta ${identity.name} memulai tes.` }); setPage('instructions', '/participant'); };
  const submit = (s: CurrentSession) => {
    const tokenValidation = validateSessionToken(s);
    if (!tokenValidation.valid) { setSubmitError(tokenValidation.message); setPage('scoring-missing'); return; }
    const latestConfig = loadScoringConfig();
    const latestQuestions = orderQuestionsForSession(loadQuestions(), s.questionOrder);
    const validationError = validateScoringConfig(latestConfig, latestQuestions);
    saveCurrentSession({ ...s, status: 'Draft', updatedAt: new Date().toISOString() });
    setSession(s);
    if (validationError) {
      setSubmitError(validationError);
      setPage('scoring-missing');
      return;
    }
    const normalizedAnswers = normalizeAnswers(s.answers);
    const scores = calculateRawScores(normalizedAnswers, latestConfig!);
    const validityStatus = determineValidity(scores, latestConfig!);
    const submitTiming = buildSubmitTiming(s.startedAt);
    const result: AssessmentResult = {
      id: s.id,
      identity: s.identity,
      answers: normalizedAnswers,
      answeredCount: Object.keys(normalizedAnswers).length,
      totalQuestions: latestQuestions.length,
      submittedAt: submitTiming.submittedAt,
      submittedDate: submitTiming.submittedDate,
      submittedTime: submitTiming.submittedTime,
      startedAt: s.startedAt,
      startedDate: s.startedDate,
      startedTime: s.startedTime,
      durationSeconds: submitTiming.durationSeconds,
      durationText: submitTiming.durationText,
      durationLabel: submitTiming.durationText,
      scores,
      status: validityStatus.status === 'invalid' || validityStatus.status === 'caution' || isDemoScoringConfig(latestConfig) ? 'Perlu Review' : 'Selesai',
      validityStatus,
      isDemoConfig: isDemoScoringConfig(latestConfig),
      interpretations: generateInterpretations(scores),
      clinicalSummary: generateClinicalSummary(scores, validityStatus),
      recommendations: generateRecommendations(scores, validityStatus),
      specialistReview: {
        status: 'pending', reviewerId: '', reviewerName: '', reviewerTitle: '', licenseNumber: '', reviewedAt: '',
        validityNotes: '', clinicalImpression: '', riskNotes: '', recommendations: '', limitations: '', finalConclusion: '', isLocked: false,
      },
    };
    saveCurrentSession({ ...s, answers: normalizedAnswers, status: 'Selesai', ...submitTiming, updatedAt: submitTiming.submittedAt });
    saveResult(result);
    writeAuditLog({ action: 'Participant submitted test', targetType: 'result', targetId: result.id, description: `Peserta ${result.identity.name} submit tes.` }); if (s.tokenId) markTokenCompleted(s.tokenId, result.id); setActiveResult(result); setSession(null); refresh(); setPage('result');
  };
  const resume = () => { const validation = validateSessionToken(session); if (validation.valid && session) setPage('test', '/test'); else { setAccessMessage(validation.message || 'Silakan masukkan token akses dan unique key terlebih dahulu.'); setPage('access', '/access'); } };
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-teal-950 dark:text-slate-100">
      <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur no-print dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <button onClick={() => setPage('landing', '/')} className="inline-flex items-center gap-3 text-left text-lg font-black text-teal-700 dark:text-teal-300">
            <BrandLogo className="h-11 w-11" />
            <span>MMPI TNI AU</span>
          </button>
          <div className="grid grid-cols-[auto_1fr_auto] gap-2 sm:flex sm:items-center">
            <Button variant="ghost" className="px-3" aria-label="Toggle dark mode" onClick={() => setDark(!dark)}>{dark ? '☀️' : '🌙'}</Button>
            <Button variant="ghost" className="whitespace-nowrap" onClick={resume}>{session ? 'Lanjutkan Draft' : 'Mulai Tes'}</Button>
            <Button variant="secondary" onClick={() => { refresh(); setPage('admin', '/admin'); }}>Admin</Button>
          </div>
        </div>
      </nav>
      {page === 'landing' && <LandingPage go={(p) => p === 'identity' ? resume() : setPage(p as Page, p === 'admin' ? '/admin' : undefined)} questionsCount={questions.length} hasScoringConfig={Boolean(config)} />}
      {page === 'access' && <TokenAccessPage reason={accessMessage} onVerified={() => { const next = loadCurrentSession(); setSession(next); setAccessMessage(''); setPage('identity', '/participant'); }} />}
      {page === 'identity' && <IdentityPage onSubmit={startIdentity} />}
      {page === 'instructions' && <InstructionsPage onStart={() => { const validation = validateSessionToken(session); if (!validation.valid) { setAccessMessage(validation.message); setPage('access', '/access'); return; } setPage('test', '/test'); }} questionsCount={questions.length} hasScoringConfig={Boolean(config)} />}
      {page === 'test' && session && <TestPage session={session} questions={orderQuestionsForSession(questions, session.questionOrder)} hasScoringConfig={Boolean(config)} onSubmit={submit} onExit={() => setPage('landing', '/')} onChange={(next) => { setSession(next); touchTokenSession(next); }} />}
      {page === 'scoring-missing' && <ScoringMissingPage message={submitError} goAdmin={() => { refresh(); setPage('admin', '/admin'); }} saveDraft={() => session && saveCurrentSession(session)} backToTest={() => setPage('test', '/test')} />}
      {page === 'result' && activeResult && <ResultsPage result={activeResult} scoringConfig={config} goHome={() => setPage('landing', '/')} />}
      {page === 'admin' && (() => {
        if (!hasAnyUser()) return <AdminSetupPage onDone={() => navigate('/admin/login')} />;
        if (currentPath === '/admin/setup') return <AdminSetupPage onDone={() => navigate('/admin/login')} />;
        if (currentPath === '/admin/login' || !validateSession().valid) return <AdminLoginPage onAuthenticated={() => navigate('/admin/dashboard')} />;
        const routeResult = currentPath.startsWith('/result/') || currentPath.startsWith('/report/') ? results.find((result) => result.id === currentPath.split('/').pop()) : null;
        if (routeResult) return <ResultsPage result={routeResult} scoringConfig={config} goHome={() => navigate('/admin/results')} />;
        return <AdminDashboard questions={questions} config={config} results={results} refresh={refresh} currentPath={currentPath === '/admin' ? '/admin/dashboard' : currentPath} navigate={navigate} openResult={(r) => { setActiveResult(r); navigate(`/result/${r.id}`); }} />;
      })()}
    </main>
  );
}

const ScoringMissingPage = ({ message, goAdmin, saveDraft, backToTest }: { message: string; goAdmin: () => void; saveDraft: () => void; backToTest: () => void }) => (
  <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
    <Card>
      <p className="text-sm font-bold uppercase tracking-wide text-amber-600">Submit belum dapat dihitung</p>
      <h1 className="mt-2 text-2xl font-black">Konfigurasi scoring belum tersedia</h1>
      <p className="mt-3 leading-7 text-slate-700 dark:text-slate-200">Konfigurasi scoring belum tersedia. Admin harus mengimpor file scoringConfig terlebih dahulu sebelum hasil dapat dihitung.</p>
      {message && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"><strong>Detail teknis:</strong> {message}</div>}
      <p className="mt-4 text-sm text-slate-500">Jawaban peserta tetap tersimpan sebagai draft. Tidak ada jawaban yang dihapus.</p>
      <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap"><Button onClick={goAdmin}>Ke Admin Dashboard</Button><Button variant="secondary" onClick={saveDraft}>Simpan Draft</Button><Button variant="ghost" onClick={backToTest}>Kembali ke Tes</Button></div>
    </Card>
  </div>
);
