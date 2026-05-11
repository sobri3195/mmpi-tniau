import { useEffect, useState } from 'react';
import type { AssessmentResult, CurrentSession, ParticipantIdentity } from './types';
import { AdminDashboard } from './pages/AdminDashboard';
import { IdentityPage } from './pages/IdentityPage';
import { InstructionsPage } from './pages/InstructionsPage';
import { LandingPage } from './pages/LandingPage';
import { ResultsPage } from './pages/ResultsPage';
import { TestPage } from './pages/TestPage';
import { Button, Card } from './components/ui';
import { calculateRawScores, determineValidity, generateClinicalSummary, generateInterpretations, generateRecommendations, isDemoScoringConfig, validateScoringConfig } from './utils/scoring';
import { clearCurrentSession, loadCurrentSession, loadQuestions, loadResults, loadScoringConfig, saveCurrentSession, saveResult, STORAGE_KEYS } from './utils/storage';

export type Page = 'landing' | 'identity' | 'instructions' | 'test' | 'result' | 'admin' | 'scoring-missing';

const newSession = (identity: ParticipantIdentity): CurrentSession => ({
  id: crypto.randomUUID(),
  identity,
  answers: {},
  currentIndex: 0,
  mode: 'single',
  status: 'Draft',
  updatedAt: new Date().toISOString(),
});

export default function App() {
  const [page, setPage] = useState<Page>(() => window.location.pathname === '/admin' ? 'admin' : 'landing');
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
  const startIdentity = (identity: ParticipantIdentity) => { const s = newSession(identity); setSession(s); saveCurrentSession(s); setPage('instructions'); };
  const submit = (s: CurrentSession) => {
    const latestConfig = loadScoringConfig();
    const latestQuestions = loadQuestions();
    const validationError = validateScoringConfig(latestConfig, latestQuestions);
    saveCurrentSession({ ...s, status: 'Draft', updatedAt: new Date().toISOString() });
    setSession(s);
    if (validationError) {
      setSubmitError(validationError);
      setPage('scoring-missing');
      return;
    }
    const scores = calculateRawScores(s.answers, latestConfig!);
    const validityStatus = determineValidity(scores, latestConfig!);
    const startedAt = new Date(s.updatedAt).getTime();
    const durationMs = Number.isFinite(startedAt) ? Date.now() - startedAt : 0;
    const durationLabel = durationMs > 0 ? `${Math.floor(durationMs / 60000)} menit ${Math.floor((durationMs % 60000) / 1000)} detik` : '-';
    const result: AssessmentResult = {
      id: s.id,
      identity: s.identity,
      answers: s.answers,
      answeredCount: Object.keys(s.answers).length,
      totalQuestions: latestQuestions.length,
      submittedAt: new Date().toISOString(),
      startedAt: s.updatedAt,
      durationLabel,
      scores,
      status: validityStatus.status === 'invalid' || validityStatus.status === 'caution' || isDemoScoringConfig(latestConfig) ? 'Perlu Review' : 'Selesai',
      validityStatus,
      isDemoConfig: isDemoScoringConfig(latestConfig),
      interpretations: generateInterpretations(scores),
      clinicalSummary: generateClinicalSummary(scores, validityStatus),
      recommendations: generateRecommendations(scores, validityStatus),
    };
    saveResult(result); clearCurrentSession(); setActiveResult(result); setSession(null); refresh(); setPage('result');
  };
  const resume = () => session ? setPage('test') : setPage('identity');
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-teal-950 dark:text-slate-100">
      <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur no-print dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <button onClick={() => setPage('landing')} className="text-left text-lg font-black text-teal-700 dark:text-teal-300">MMPI TNI AU</button>
          <div className="grid grid-cols-[auto_1fr_auto] gap-2 sm:flex sm:items-center">
            <Button variant="ghost" className="px-3" aria-label="Toggle dark mode" onClick={() => setDark(!dark)}>{dark ? '☀️' : '🌙'}</Button>
            <Button variant="ghost" className="whitespace-nowrap" onClick={resume}>{session ? 'Lanjutkan Draft' : 'Mulai Tes'}</Button>
            <Button variant="secondary" onClick={() => { refresh(); setPage('admin'); }}>Admin</Button>
          </div>
        </div>
      </nav>
      {page === 'landing' && <LandingPage go={(p) => setPage(p as Page)} questionsCount={questions.length} hasScoringConfig={Boolean(config)} />}
      {page === 'identity' && <IdentityPage onSubmit={startIdentity} />}
      {page === 'instructions' && <InstructionsPage onStart={() => setPage('test')} questionsCount={questions.length} hasScoringConfig={Boolean(config)} />}
      {page === 'test' && session && <TestPage session={session} questions={questions} hasScoringConfig={Boolean(config)} onSubmit={submit} onExit={() => setPage('landing')} onChange={setSession} />}
      {page === 'scoring-missing' && <ScoringMissingPage message={submitError} goAdmin={() => { refresh(); setPage('admin'); }} saveDraft={() => session && saveCurrentSession(session)} backToTest={() => setPage('test')} />}
      {page === 'result' && activeResult && <ResultsPage result={activeResult} scoringConfig={config} goHome={() => setPage('landing')} />}
      {page === 'admin' && <AdminDashboard questions={questions} config={config} results={results} refresh={refresh} openResult={(r) => { setActiveResult(r); setPage('result'); }} />}
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
      <p className="mt-4 text-sm text-slate-500">Jawaban peserta tetap aman di localStorage sebagai draft. Tidak ada jawaban yang dihapus.</p>
      <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap"><Button onClick={goAdmin}>Ke Admin Dashboard</Button><Button variant="secondary" onClick={saveDraft}>Simpan Draft</Button><Button variant="ghost" onClick={backToTest}>Kembali ke Tes</Button></div>
    </Card>
  </div>
);
