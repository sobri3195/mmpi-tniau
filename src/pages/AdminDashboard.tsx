import { useMemo, useState } from 'react';
import type { AssessmentResult, Question, ScoringConfig } from '../types';
import { Badge, Button } from '../components/ui';
import { AlertBox, StatCard } from '../components/admin/AdminCommon';
import { ImportQuestionsPanel } from '../components/admin/ImportQuestionsPanel';
import { ImportScoringPanel } from '../components/admin/ImportScoringPanel';
import { ImportNormPanel } from '../components/admin/ImportNormPanel';
import { ImportInterpretationPanel } from '../components/admin/ImportInterpretationPanel';
import { ImportCodeTypePanel } from '../components/admin/ImportCodeTypePanel';
import { ResultsManagementPanel } from '../components/admin/ResultsManagementPanel';
import { SystemReadinessCheck } from '../components/admin/SystemReadinessCheck';
import { AdminSettingsPanel } from '../components/admin/AdminSettingsPanel';
import { BackupRestorePanel } from '../components/admin/BackupRestorePanel';
import { TokenManagementPanel } from '../components/admin/TokenManagementPanel';
import { AdminLogin } from './AdminLogin';
import { ADMIN_AUTH_KEY, loadAdminSettings, loadAuxConfig } from '../utils/adminStorage';
import { isDemoLikeConfig, validateInterpretationConfig, validateNormTable, validateScoringConfigAdmin } from '../utils/configValidation';

const tabs = [
  ['dashboard', 'Dashboard Ringkas'],
  ['questions', 'Import Bank Soal'],
  ['scoring', 'Import Scoring'],
  ['norm', 'Norma T-score'],
  ['interpretation', 'Interpretasi'],
  ['codetype', 'Code Type'],
  ['results', 'Hasil Peserta'],
  ['tokens', 'Token Peserta'],
  ['settings', 'Pengaturan Laporan'],
  ['backup', 'Reset & Backup'],
] as const;
type TabKey = typeof tabs[number][0];
type ToastTone = 'teal' | 'amber' | 'rose';

export const AdminDashboard = ({ questions, config, results, refresh, openResult }: { questions: Question[]; config: ScoringConfig | null; results: AssessmentResult[]; refresh: () => void; openResult: (result: AssessmentResult) => void }) => {
  const [authenticated, setAuthenticated] = useState(() => localStorage.getItem(ADMIN_AUTH_KEY) === 'true');
  const [activeTab, setActiveTab] = useState<TabKey>(() => window.location.pathname === '/admin/tokens' ? 'tokens' : 'dashboard');
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);
  const normTable = loadAuxConfig('normTable');
  const interpretationConfig = loadAuxConfig('interpretationConfig');
  const codeTypeConfig = loadAuxConfig('codeTypeConfig');
  const settings = loadAdminSettings();
  const showToast = (message: string, tone: ToastTone = 'teal') => { setToast({ message, tone }); window.setTimeout(() => setToast(null), 3500); };
  const logout = () => { localStorage.removeItem(ADMIN_AUTH_KEY); setAuthenticated(false); };

  const summary = useMemo(() => {
    const scoringValidation = validateScoringConfigAdmin(config, questions);
    const normValidation = validateNormTable(normTable, config);
    const interpretationValidation = validateInterpretationConfig(interpretationConfig);
    const validReports = results.filter((result) => result.validityStatus?.status === 'valid' && result.status === 'Selesai').length;
    const reviewReports = results.filter((result) => result.status === 'Perlu Review').length;
    const invalidReports = results.filter((result) => result.validityStatus?.status === 'invalid' || result.validityStatus?.requiresRetest).length;
    return { scoringValidation, normValidation, interpretationValidation, validReports, reviewReports, invalidReports };
  }, [config, interpretationConfig, normTable, questions, results]);

  if (!authenticated) return <AdminLogin onAuthenticated={() => setAuthenticated(true)} />;

  const dashboard = <div className="space-y-6"><AlertBox tone="rose"><strong>Mode Demo - Tidak Valid untuk Interpretasi Klinis.</strong> Semua soal, scoringConfig, normTable, dan interpretationConfig final wajib diimport admin dari file resmi/berizin. Interpretasi spesialis dinonaktifkan jika konfigurasi belum lengkap atau masih demo.</AlertBox><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><StatCard label="Status bank soal" value={questions.length === 567 ? 'Siap' : 'Belum siap'} tone={questions.length === 567 ? 'teal' : 'rose'} /><StatCard label="Jumlah soal terimport" value={questions.length} tone={questions.length === 567 ? 'teal' : 'amber'} /><StatCard label="Status scoring config" value={summary.scoringValidation.valid ? 'Valid' : 'Belum valid'} tone={summary.scoringValidation.valid ? 'teal' : 'rose'} /><StatCard label="Jumlah skala tersedia" value={config?.scales?.length ?? 0} tone={config?.scales?.length ? 'teal' : 'rose'} /><StatCard label="Status norma T-score" value={summary.normValidation.valid && normTable ? 'Ada' : 'Belum lengkap'} tone={summary.normValidation.valid && normTable ? 'teal' : 'amber'} /><StatCard label="Status interpretation config" value={summary.interpretationValidation.valid ? 'Ada' : 'Belum lengkap'} tone={summary.interpretationValidation.valid ? 'teal' : 'amber'} /><StatCard label="Jumlah hasil peserta" value={results.length} /><StatCard label="Jumlah laporan valid" value={summary.validReports} tone="teal" /><StatCard label="Jumlah laporan perlu review" value={summary.reviewReports} tone="amber" /><StatCard label="Jumlah laporan invalid/retest" value={summary.invalidReports} tone="rose" /></div><SystemReadinessCheck questions={questions} scoringConfig={config} normTable={normTable} interpretationConfig={interpretationConfig} codeTypeConfig={codeTypeConfig} settings={settings} />{(isDemoLikeConfig(config) || isDemoLikeConfig(interpretationConfig)) && <AlertBox tone="rose">Konfigurasi masih demo dan tidak boleh dipakai untuk laporan final.</AlertBox>}</div>;

  return <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8"><div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-wide text-teal-700">Admin Dashboard</p><h1 className="text-2xl font-black sm:text-3xl">Asesmen MMPI TNI AU / SPPG</h1><p className="text-slate-500">Kelola bank soal, scoring, norma, interpretasi, token peserta, hasil, laporan, backup, dan reset data lokal.</p></div><div className="flex flex-wrap gap-2"><Badge tone="amber">localStorage + Vercel</Badge><Button variant="ghost" onClick={() => { refresh(); showToast('Data direfresh.', 'teal'); }}>Refresh</Button><Button variant="danger" onClick={logout}>Logout Admin</Button></div></div>{toast && <div className="fixed right-4 top-20 z-50 max-w-sm"><AlertBox tone={toast.tone}>{toast.message}</AlertBox></div>}<div className="grid gap-6 lg:grid-cols-[260px_1fr]"><aside className="h-fit rounded-3xl border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/80"><nav className="grid gap-2">{tabs.map(([key, label]) => <button key={key} type="button" onClick={() => setActiveTab(key)} className={`rounded-2xl px-4 py-3 text-left text-sm font-bold transition ${activeTab === key ? 'bg-teal-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>{label}</button>)}</nav></aside><section className="min-w-0">{activeTab === 'dashboard' && dashboard}{activeTab === 'questions' && <ImportQuestionsPanel questions={questions} onRefresh={refresh} toast={showToast} />}{activeTab === 'scoring' && <ImportScoringPanel questions={questions} config={config} onRefresh={refresh} toast={showToast} />}{activeTab === 'norm' && <ImportNormPanel normTable={normTable} config={config} onRefresh={refresh} toast={showToast} />}{activeTab === 'interpretation' && <ImportInterpretationPanel config={interpretationConfig} onRefresh={refresh} toast={showToast} />}{activeTab === 'codetype' && <ImportCodeTypePanel config={codeTypeConfig} onRefresh={refresh} toast={showToast} />}{activeTab === 'results' && <ResultsManagementPanel results={results} onRefresh={refresh} openResult={openResult} toast={showToast} />}{activeTab === 'tokens' && <TokenManagementPanel results={results} toast={showToast} />}{activeTab === 'settings' && <AdminSettingsPanel onRefresh={refresh} toast={showToast} />}{activeTab === 'backup' && <BackupRestorePanel onRefresh={refresh} toast={showToast} />}</section></div></div>;
};
