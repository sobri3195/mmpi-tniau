import { useEffect, useState } from 'react';
import type { AssessmentResult, CurrentSession, ParticipantIdentity } from './types';
import { AdminDashboard } from './pages/AdminDashboard';
import { IdentityPage } from './pages/IdentityPage';
import { InstructionsPage } from './pages/InstructionsPage';
import { LandingPage } from './pages/LandingPage';
import { ResultsPage } from './pages/ResultsPage';
import { TestPage } from './pages/TestPage';
import { Button } from './components/ui';
import { calculateRawScores } from './utils/scoring';
import { clearCurrentSession, loadCurrentSession, loadQuestions, loadResults, loadScoringConfig, saveCurrentSession, saveResult } from './utils/storage';

type Page = 'landing' | 'identity' | 'instructions' | 'test' | 'result' | 'admin';

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
  const [page, setPage] = useState<Page>('landing');
  const [dark, setDark] = useState(() => localStorage.getItem('sppg_mmpi_admin_settings')?.includes('dark'));
  const [session, setSession] = useState<CurrentSession | null>(() => loadCurrentSession());
  const [questions, setQuestions] = useState(() => loadQuestions());
  const [config, setConfig] = useState(() => loadScoringConfig());
  const [results, setResults] = useState(() => loadResults());
  const [activeResult, setActiveResult] = useState<AssessmentResult | null>(null);

  useEffect(() => { document.documentElement.classList.toggle('dark', Boolean(dark)); localStorage.setItem('sppg_mmpi_admin_settings', JSON.stringify({ dark })); }, [dark]);
  const refresh = () => { setQuestions(loadQuestions()); setConfig(loadScoringConfig()); setResults(loadResults()); };
  const startIdentity = (identity: ParticipantIdentity) => { const s = newSession(identity); setSession(s); saveCurrentSession(s); setPage('instructions'); };
  const submit = (s: CurrentSession) => {
    if (!config) { alert('Konfigurasi scoring belum tersedia. Hubungi admin.'); return; }
    const scores = calculateRawScores(s.answers, config);
    const result: AssessmentResult = { id: s.id, identity: s.identity, answers: s.answers, answeredCount: Object.keys(s.answers).length, totalQuestions: questions.length, submittedAt: new Date().toISOString(), scores, status: 'Perlu Review' };
    saveResult(result); clearCurrentSession(); setActiveResult(result); setSession(null); refresh(); setPage('result');
  };
  const resume = () => session ? setPage('test') : setPage('identity');
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-teal-950 dark:text-slate-100">
      <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur no-print dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3"><button onClick={() => setPage('landing')} className="font-black text-teal-700 dark:text-teal-300">MMPI TNI AU</button><div className="flex gap-2"><Button variant="ghost" onClick={() => setDark(!dark)}>{dark ? '☀️' : '🌙'}</Button><Button variant="ghost" onClick={resume}>{session ? 'Lanjutkan Draft' : 'Mulai Tes'}</Button><Button variant="secondary" onClick={() => { refresh(); setPage('admin'); }}>Admin</Button></div></div>
      </nav>
      {page === 'landing' && <LandingPage go={(p) => setPage(p as Page)} />}
      {page === 'identity' && <IdentityPage onSubmit={startIdentity} />}
      {page === 'instructions' && <InstructionsPage onStart={() => setPage('test')} />}
      {page === 'test' && session && <TestPage session={session} questions={questions} onSubmit={submit} onExit={() => setPage('landing')} onChange={setSession} />}
      {page === 'result' && activeResult && <ResultsPage result={activeResult} goHome={() => setPage('landing')} />}
      {page === 'admin' && <AdminDashboard questions={questions} config={config} results={results} refresh={refresh} openResult={(r) => { setActiveResult(r); setPage('result'); }} />}
    </main>
  );
}
