import { Suspense, lazy, useEffect, useState } from 'react';
import type { AssessmentResult, CurrentSession, ParticipantIdentity } from './types';
import { Button, Card } from './components/ui';
import { BrandLogo } from './components/BrandLogo';
import { calculateRawScores, determineValidity, generateClinicalSummary, generateRecommendations, isDemoScoringConfig, validateScoringConfig } from './utils/scoring';
import { AUTO_DEFAULT_WARNING, ensureScoringConfigExists, initializeAutoDefaultScoringConfig, isAutoDefaultScoring } from './utils/autoDefaultScoring';
import { getRHFormByResultId, loadAuxiliaryConfig, loadCurrentSession, loadQuestions, loadResults, loadScoringConfig, saveCurrentSession, saveResult, STORAGE_KEYS } from './utils/storage';
import { touchTokenSession, validateSessionToken } from './utils/tokenAccess';
import { canShowContinueDraft, validateParticipantAccess } from './utils/tokenValidation';
import { ParticipantProtectedRoute, getParticipantAccessRedirect } from './components/auth/ParticipantProtectedRoute';
import { hasAnyUser } from './utils/userStorage';
import { validateSession } from './utils/session';
import { writeAuditLog } from './utils/auditLog';
import { buildStartTiming, buildSubmitTiming } from './utils/time';
import { orderQuestionsForSession } from './utils/questions';
import { normalizeAnswers } from './utils/answerFormat';
import { buildDualInterpretations, ensureInterpretationConfigsExist, initializeDefaultInterpretationConfigs } from './utils/sourceInterpretations';
import { buildSummaryAnalysis, initializeDefaultSummaryAnalysisConfig, loadSummaryAnalysisConfig } from './utils/summaryAnalysis';
import { attachConfigVersionsToResult } from './utils/configVersioning';
import { updateSessionMonitoring } from './utils/sessionMonitoring';
import { canStartNewParticipantSession } from './utils/lockdownMode';


const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage').then((module) => ({ default: module.AdminLoginPage })));
const AdminSetupPage = lazy(() => import('./pages/AdminSetupPage').then((module) => ({ default: module.AdminSetupPage })));
const IdentityPage = lazy(() => import('./pages/IdentityPage').then((module) => ({ default: module.IdentityPage })));
const InstructionsPage = lazy(() => import('./pages/InstructionsPage').then((module) => ({ default: module.InstructionsPage })));
const LandingPage = lazy(() => import('./pages/LandingPage').then((module) => ({ default: module.LandingPage })));
const ResultsPage = lazy(() => import('./pages/ResultsPage').then((module) => ({ default: module.ResultsPage })));
const RHSkriningPage = lazy(() => import('./pages/RHSkriningPage').then((module) => ({ default: module.RHSkriningPage })));
const RHReviewPage = lazy(() => import('./pages/RHReviewPage').then((module) => ({ default: module.RHReviewPage })));
const TokenAccessPage = lazy(() => import('./pages/TokenAccessPage').then((module) => ({ default: module.TokenAccessPage })));
const TokenDisabledPage = lazy(() => import('./pages/TokenDisabledPage').then((module) => ({ default: module.TokenDisabledPage })));
const TestPage = lazy(() => import('./pages/TestPage').then((module) => ({ default: module.TestPage })));

const PageLoader = () => <div className="mx-auto max-w-6xl px-4 py-8 text-sm font-semibold text-slate-600 dark:text-slate-300">Memuat halaman...</div>;

export type Page = 'landing' | 'access' | 'token-disabled' | 'identity' | 'instructions' | 'test' | 'result' | 'rh-skrining' | 'rh-review' | 'admin' | 'scoring-missing';

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
    sessionStatus: 'in_progress',
    mmpiStatus: 'mmpi_in_progress',
    rhStatus: 'not_started',
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
    const protectedPage = (target: Page) => { const validation = validateParticipantAccess({ currentRoute: pathname }); return validation.allowed ? target : getParticipantAccessRedirect(validation.reason) === '/token-disabled' ? 'token-disabled' : 'access'; };
    if (pathname === '/rh-skrining/review' || pathname === '/rh-review') return protectedPage('rh-review');
    if (pathname === '/rh-skrining') return protectedPage('rh-skrining');
    if (pathname === '/token-disabled') return 'token-disabled';
    if (pathname.startsWith('/result/')) { const result = loadResults().find((item) => item.id === pathname.split('/').pop()); return result ? protectedPage('result') : 'admin'; }
    if (pathname.startsWith('/admin') || pathname.startsWith('/report/')) return 'admin';
    if (pathname === '/access') return 'access';
    if (pathname === '/participant') return protectedPage('identity');
    if (pathname === '/instruction') return protectedPage('instructions');
    if (pathname === '/test') return protectedPage('test');
    return 'landing';
  };
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const [page, setPageState] = useState<Page>(() => routeToPage(window.location.pathname));
  const [accessMessage, setAccessMessage] = useState(() => window.location.pathname === '/test' && !validateSessionToken().valid ? 'Silakan masukkan token akses dan kunci unik terlebih dahulu.' : '');
  useEffect(() => {
    const onPopState = () => { setCurrentPath(window.location.pathname); setPageState(routeToPage(window.location.pathname)); };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  useEffect(() => {
    const protectedPaths = ['/participant', '/instruction', '/test', '/rh-skrining', '/result', '/report'];
    const isProtectedPath = protectedPaths.some((path) => currentPath === path || currentPath.startsWith(`${path}/`));
    if (isProtectedPath && page === 'access' && currentPath !== '/access') {
      window.history.replaceState(null, '', '/access');
      setCurrentPath('/access');
    }
    if (isProtectedPath && page === 'token-disabled' && currentPath !== '/token-disabled') {
      window.history.replaceState(null, '', '/token-disabled');
      setCurrentPath('/token-disabled');
    }
  }, [currentPath, page]);
  const navigate = (path: string) => { window.history.replaceState(null, '', path); setCurrentPath(path); setPageState(routeToPage(path)); };
  const setPage = (next: Page, path?: string) => { setPageState(next); if (path) { window.history.replaceState(null, '', path); setCurrentPath(path); } };
  const [dark, setDark] = useState(() => localStorage.getItem(STORAGE_KEYS.adminSettings)?.includes('dark'));
  const [session, setSession] = useState<CurrentSession | null>(() => loadCurrentSession());
  const [questions, setQuestions] = useState(() => { const loaded = loadQuestions(); initializeAutoDefaultScoringConfig(loaded); return loaded; });
  const [config, setConfig] = useState(() => loadScoringConfig());
  const [results, setResults] = useState(() => loadResults());
  const [activeResult, setActiveResult] = useState<AssessmentResult | null>(() => { const path = window.location.pathname; const id = path.startsWith('/result/') || path.startsWith('/report/') ? path.split('/').pop() : ''; return id ? loadResults().find((result) => result.id === id) ?? null : null; });
  const [submitError, setSubmitError] = useState('');

  useEffect(() => { const ensured = ensureScoringConfigExists(questions); if (!config || ensured.config.version !== config.version) setConfig(loadScoringConfig()); initializeDefaultInterpretationConfigs(ensured.config); initializeDefaultSummaryAnalysisConfig(ensured.config); }, [config, questions]);

  useEffect(() => {
    if (page === 'rh-skrining' && currentPath.startsWith('/result/') && activeResult && !activeResult.rhCompleted) { setPage('rh-skrining', '/rh-skrining'); return; }
    if (page === 'rh-skrining' && activeResult?.rhCompleted) { setPage('result', `/result/${activeResult.id}`); return; }
    if ((page === 'rh-skrining' || page === 'rh-review') && !activeResult) {
      const pending = session ? loadResults().find((result) => result.id === session.id) : null;
      if (pending?.rhCompleted && page === 'rh-skrining') setPage('result', `/result/${pending.id}`);
      else if (pending) setActiveResult(pending);
      else setPage('landing', '/');
    }
  }, [activeResult, currentPath, page, session]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', Boolean(dark));
    const currentSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.adminSettings) || '{}');
    localStorage.setItem(STORAGE_KEYS.adminSettings, JSON.stringify({ ...currentSettings, dark }));
  }, [dark]);
  const refresh = () => { setQuestions(loadQuestions()); setConfig(loadScoringConfig()); setResults(loadResults()); };
  const redirectDenied = (path: string, _reason?: string, message?: string) => { if (path === '/token-disabled') setPage('token-disabled', path); else { setAccessMessage(message || 'Silakan masukkan token akses dan kunci unik terlebih dahulu.'); setPage('access', path); } };
  const startIdentity = (identity: ParticipantIdentity) => { ensureScoringConfigExists(questions); refresh(); if (!canStartNewParticipantSession()) { setAccessMessage('Lockdown mode aktif. Peserta belum dapat memulai tes baru.'); setPage('access', '/access'); return; } const validation = validateParticipantAccess({ session: loadCurrentSession(), currentRoute: '/participant' }); if (!validation.allowed) { redirectDenied(getParticipantAccessRedirect(validation.reason), validation.reason, validation.message); return; } const s = newSession(identity, questions, session); setSession(s); saveCurrentSession(s); touchTokenSession(s); updateSessionMonitoring(s, questions.length); writeAuditLog({ action: 'Participant started test', targetType: 'token', targetId: s.tokenId ?? '', description: `Peserta ${identity.name} memulai tes.` }); setPage('instructions', '/participant'); };
  const submit = (s: CurrentSession) => {
    const tokenValidation = validateParticipantAccess({ session: s, currentRoute: '/test' });
    if (!tokenValidation.allowed) { if (tokenValidation.reason === 'token_disabled' || tokenValidation.reason === 'paused_token_disabled') { setSession(tokenValidation.session); setPage('token-disabled', '/token-disabled'); } else { setAccessMessage(tokenValidation.message); setPage('access', '/access'); } return; }
    const ensured = ensureScoringConfigExists(loadQuestions());
    const latestConfig = ensured.config;
    ensureInterpretationConfigsExist(latestConfig);
    initializeDefaultSummaryAnalysisConfig(latestConfig);
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
    if (Object.keys(normalizedAnswers).length < latestQuestions.length) { setSubmitError(`Semua soal MMPI wajib dijawab (${Object.keys(normalizedAnswers).length}/${latestQuestions.length}).`); setPage('scoring-missing'); return; }
    const scores = calculateRawScores(normalizedAnswers, latestConfig!);
    const validityStatus = determineValidity(scores, latestConfig!);
    const submitTiming = buildSubmitTiming(s.startedAt);
    const summaryConfig = loadSummaryAnalysisConfig();
    const result: AssessmentResult = attachConfigVersionsToResult({
      id: s.id,
      resultId: s.id,
      tokenId: s.tokenId,
      identity: s.identity,
      participant: s.identity,
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
      assessment: { instrument: 'MMPI', totalItems: latestQuestions.length, answerFormat: 'plus_minus', startedAt: s.startedAt, startedDate: s.startedDate, startedTime: s.startedTime, submittedAt: submitTiming.submittedAt, submittedDate: submitTiming.submittedDate, submittedTime: submitTiming.submittedTime, durationSeconds: submitTiming.durationSeconds, durationText: submitTiming.durationText, status: 'pending_rh' },
      scores,
      status: validityStatus.status === 'invalid' || validityStatus.status === 'caution' || isDemoScoringConfig(latestConfig) || isAutoDefaultScoring(latestConfig) ? 'Perlu Review' : 'Selesai',
      validityStatus,
      isDemoConfig: isDemoScoringConfig(latestConfig),
      scoringStatus: { status: isAutoDefaultScoring(latestConfig) ? 'scored_auto_default' : latestConfig?.isOfficial === true ? 'scored_official' : 'pending_scoring', scoringConfigVersion: latestConfig?.version ?? 'unknown', isAutoDefault: isAutoDefaultScoring(latestConfig), isOfficial: latestConfig?.isOfficial === true, calculatedAt: submitTiming.submittedAt, warning: isAutoDefaultScoring(latestConfig) ? AUTO_DEFAULT_WARNING : undefined },
      interpretations: buildDualInterpretations(scores, validityStatus, loadAuxiliaryConfig('interpretationRusdiMaslim'), loadAuxiliaryConfig('interpretationHubertus')),
      clinicalSummary: generateClinicalSummary(scores, validityStatus),
      recommendations: generateRecommendations(scores, validityStatus),
      specialistReview: {
        status: 'pending', reviewerId: '', reviewerName: '', reviewerTitle: '', licenseNumber: '', reviewedAt: '',
        validityNotes: '', clinicalImpression: '', riskNotes: '', recommendations: '', limitations: '', finalConclusion: '', isLocked: false,
      },
      rhFormId: '',
      rhCompleted: false,
      rhSummary: { hasMedicalRedFlags: false, hasPsychiatricRedFlags: false, hasSubstanceHistory: false, hasLegalHistory: false, needsSpecialistReview: false },
      workflow: { status: 'awaiting_rh', operatorVerifiedBy: '', operatorVerifiedAt: '', specialistReviewedBy: '', specialistReviewedAt: '', finalApprovedBy: '', finalApprovedAt: '', revisionNotes: [], history: [] },
    } as AssessmentResult);
    result.summaryAnalysis = buildSummaryAnalysis(result, summaryConfig);
    const completedSession = { ...s, answers: normalizedAnswers, status: 'mmpi_completed_pending_rh' as const, mmpiStatus: 'mmpi_completed_pending_rh' as const, rhStatus: 'not_started' as const, ...submitTiming, updatedAt: submitTiming.submittedAt };
    saveCurrentSession(completedSession);
    updateSessionMonitoring(completedSession, latestQuestions.length);
    saveResult(result);
    writeAuditLog({ action: 'Participant submitted MMPI pending RH', targetType: 'result', targetId: result.id, description: `Peserta ${result.identity.name} submit MMPI dan wajib mengisi RH.` }); setActiveResult(result); refresh(); setPage('rh-skrining', '/rh-skrining');
  };
  const resume = () => { const latestSession = loadCurrentSession(); const latestValidation = validateParticipantAccess({ session: latestSession, currentRoute: '/resume' }); if (!latestValidation.allowed) { setSession(latestValidation.session); const redirect = getParticipantAccessRedirect(latestValidation.reason); if (redirect === '/token-disabled') setPage('token-disabled', redirect); else { setAccessMessage(latestValidation.message); setPage('access', '/access'); } return; } const session = latestSession; if (session?.rhStatus === 'in_progress' || session?.mmpiStatus === 'mmpi_completed_pending_rh') { const pending = loadResults().find((result) => result.id === session.id); if (pending) { setActiveResult(pending); setPage('rh-skrining', '/rh-skrining'); return; } } const validation = validateParticipantAccess({ session, currentRoute: '/resume' }); if (validation.allowed && session) setPage('test', '/test'); else { setAccessMessage(validation.message || 'Silakan masukkan token akses dan kunci unik terlebih dahulu.'); setPage('access', '/access'); } };
  const currentSessionValidation = validateParticipantAccess({ session: loadCurrentSession(), currentRoute: currentPath });
  const canResumeDraft = canShowContinueDraft();
  const adminSessionValid = validateSession().valid;
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
            {canResumeDraft ? <Button variant="ghost" className="whitespace-nowrap" onClick={resume}>Lanjutkan Draft</Button> : currentSessionValidation.reason === 'token_disabled' || currentSessionValidation.reason === 'paused_token_disabled' ? <Button variant="ghost" className="whitespace-nowrap" disabled>Draft tidak tersedia</Button> : <Button variant="ghost" className="whitespace-nowrap" onClick={() => setPage('access', '/access')}>Mulai Tes</Button>}
            {adminSessionValid && <Button variant="secondary" onClick={() => { refresh(); setPage('admin', '/admin'); }}>Dashboard Admin</Button>}
          </div>
        </div>
      </nav>
      <Suspense fallback={<PageLoader />}>
        {page === 'landing' && <LandingPage go={(p) => p === 'identity' ? setPage('access', '/access') : setPage(p as Page, p === 'admin' ? '/admin' : undefined)} questionsCount={questions.length} />}
        {page === 'token-disabled' && <TokenDisabledPage goAccess={() => { setAccessMessage(''); setPage('access', '/access'); }} />}
        {page === 'access' && <TokenAccessPage reason={accessMessage} onVerified={() => { const next = loadCurrentSession(); setSession(next); setAccessMessage(''); setPage('identity', '/participant'); }} />}
        {page === 'identity' && <ParticipantProtectedRoute currentRoute="/participant" onRedirect={redirectDenied}><IdentityPage onSubmit={startIdentity} /></ParticipantProtectedRoute>}
        {page === 'instructions' && <ParticipantProtectedRoute currentRoute="/instruction" onRedirect={redirectDenied}><InstructionsPage onStart={() => { ensureScoringConfigExists(questions); refresh(); const validation = validateParticipantAccess({ session: loadCurrentSession(), currentRoute: '/instruction' }); if (!validation.allowed) { redirectDenied(getParticipantAccessRedirect(validation.reason), validation.reason, validation.message); return; } setPage('test', '/test'); }} questionsCount={questions.length} /></ParticipantProtectedRoute>}
        {page === 'test' && session && <ParticipantProtectedRoute currentRoute="/test" onRedirect={redirectDenied}><TestPage session={session} questions={orderQuestionsForSession(questions, session.questionOrder)} onSubmit={submit} onExit={() => setPage('landing', '/')} onAccessDenied={() => setPage('token-disabled', '/token-disabled')} onChange={(next) => { setSession(next); touchTokenSession(next); updateSessionMonitoring(next, questions.length); }} /></ParticipantProtectedRoute>}
        {page === 'scoring-missing' && <ScoringMissingPage message={submitError} goAdmin={() => { refresh(); setPage('admin', '/admin'); }} saveDraft={() => session && saveCurrentSession(session)} backToTest={() => setPage('test', '/test')} />}
        {page === 'result' && activeResult && <ParticipantProtectedRoute currentRoute="/result" onRedirect={redirectDenied}>{activeResult.rhCompleted ? <ResultsPage result={activeResult} scoringConfig={config} goHome={() => setPage('landing', '/')} /> : <RHSkriningPage result={activeResult} onDone={(completed) => { setActiveResult(completed); refresh(); setSession(null); setPage('result', `/result/${completed.id}`); }} onCancel={() => setPage('landing', '/')} />}</ParticipantProtectedRoute>}
        {page === 'rh-skrining' && activeResult && <ParticipantProtectedRoute currentRoute="/rh-skrining" onRedirect={redirectDenied}><RHSkriningPage result={activeResult} onDone={(completed) => { setActiveResult(completed); refresh(); setSession(null); setPage('result', `/result/${completed.id}`); }} onCancel={() => setPage('landing', '/')} /></ParticipantProtectedRoute>}
        {page === 'rh-review' && activeResult && <ParticipantProtectedRoute currentRoute="/rh-review" onRedirect={redirectDenied}><RHReviewPage result={activeResult} form={getRHFormByResultId(activeResult.id)} goBack={() => setPage('result', `/result/${activeResult.id}`)} /></ParticipantProtectedRoute>}
        {page === 'admin' && (() => {
          if (!hasAnyUser()) return <AdminSetupPage onDone={() => navigate('/admin/login')} />;
          if (currentPath === '/admin/setup') return <AdminSetupPage onDone={() => navigate('/admin/login')} />;
          if (currentPath === '/admin/login' || !validateSession().valid) return <AdminLoginPage onAuthenticated={() => navigate('/admin/dashboard')} />;
          const reportRhId = currentPath.startsWith('/report/') && currentPath.endsWith('/rh') ? currentPath.split('/')[2] : '';
          if (reportRhId) { const rhResult = results.find((result) => result.id === reportRhId); return <RHReviewPage result={rhResult} form={rhResult ? getRHFormByResultId(rhResult.id) : null} goBack={() => navigate('/admin/rh')} />; }
          const routeResult = currentPath.startsWith('/result/') || currentPath.startsWith('/report/') ? results.find((result) => result.id === currentPath.split('/').pop()) : null;
          if (routeResult) return routeResult.rhCompleted ? <ResultsPage result={routeResult} scoringConfig={config} goHome={() => navigate('/admin/results')} /> : <RHReviewPage result={routeResult} form={getRHFormByResultId(routeResult.id)} goBack={() => navigate('/admin/results')} />;
          return <AdminDashboard questions={questions} config={config} results={results} refresh={refresh} currentPath={currentPath === '/admin' ? '/admin/dashboard' : currentPath} navigate={navigate} openResult={(r) => { setActiveResult(r); navigate(`/result/${r.id}`); }} />;
        })()}
      </Suspense>
    </main>
  );
}

const ScoringMissingPage = ({ message, goAdmin, saveDraft, backToTest }: { message: string; goAdmin: () => void; saveDraft: () => void; backToTest: () => void }) => (
  <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
    <Card>
      <p className="text-sm font-bold uppercase tracking-wide text-amber-600">Submit belum dapat dilanjutkan</p>
      <h1 className="mt-2 text-2xl font-black">Perlu pemeriksaan teknis sebelum submit</h1>
      <p className="mt-3 leading-7 text-slate-700 dark:text-slate-200">Sistem akan membuat scoringConfig auto-default bila konfigurasi kosong. Jika halaman ini muncul, periksa detail teknis atau validasi token/sesi peserta.</p>
      {message && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"><strong>Detail teknis:</strong> {message}</div>}
      <p className="mt-4 text-sm text-slate-500">Jawaban peserta tetap tersimpan sebagai draft. Tidak ada jawaban yang dihapus.</p>
      <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap"><Button onClick={goAdmin}>Ke Admin Dashboard</Button><Button variant="secondary" onClick={saveDraft}>Simpan Draft</Button><Button variant="ghost" onClick={backToTest}>Kembali ke Tes</Button></div>
    </Card>
  </div>
);
