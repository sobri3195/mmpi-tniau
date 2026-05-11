import { useMemo } from 'react';
import type { AssessmentResult, Question, ScoringConfig } from '../types';
import { Badge, Button, Card } from '../components/ui';
import { StatCard } from '../components/admin/AdminCommon';
import { ImportQuestionsPanel } from '../components/admin/ImportQuestionsPanel';
import { ImportScoringPanel } from '../components/admin/ImportScoringPanel';
import { ImportNormPanel } from '../components/admin/ImportNormPanel';
import { ImportInterpretationPanel } from '../components/admin/ImportInterpretationPanel';
import { ImportCodeTypePanel } from '../components/admin/ImportCodeTypePanel';
import { InterpretationConfigPanel } from '../components/admin/InterpretationConfigPanel';
import { ResultsManagementPanel } from '../components/admin/ResultsManagementPanel';
import { SystemReadinessCheck } from '../components/admin/SystemReadinessCheck';
import { AdminSettingsPanel } from '../components/admin/AdminSettingsPanel';
import { BackupRestorePanel } from '../components/admin/BackupRestorePanel';
import { TokenManagementPanel } from '../components/admin/TokenManagementPanel';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { RoleBadge } from '../components/admin/RoleBadge';
import { AuditLogPanel } from '../components/admin/AuditLogPanel';
import { UserManagementPage } from './UserManagementPage';
import { SpecialistReviewPage } from './SpecialistReviewPage';
import { PermissionGuard } from '../components/auth/PermissionGuard';
import { AccessDenied } from '../components/auth/ProtectedRoute';
import { getCurrentUser, logoutUser } from '../utils/session';
import { getUsers } from '../utils/userStorage';
import { ADMIN_STORAGE_KEYS, loadAdminSettings, loadAuxConfig, readAdminJson } from '../utils/adminStorage';
import { isDemoLikeConfig, validateInterpretationConfig, validateNormTable, validateScoringConfigAdmin } from '../utils/configValidation';
import { getAuditLogs } from '../utils/auditLog';
import type { AccessToken } from '../types';

export const AdminDashboard = ({ questions, config, results, refresh, openResult, currentPath, navigate }: { questions: Question[]; config: ScoringConfig | null; results: AssessmentResult[]; refresh: () => void; openResult: (result: AssessmentResult) => void; currentPath: string; navigate: (path: string) => void }) => {
  const user = getCurrentUser();
  const normTable = loadAuxConfig('normTable');
  const interpretationConfig = loadAuxConfig('interpretationConfig');
  const rusdiConfig = loadAuxConfig('interpretationRusdiMaslim');
  const hubertusConfig = loadAuxConfig('interpretationHubertus');
  const codeTypeConfig = loadAuxConfig('codeTypeConfig');
  const rusdiCodeTypeConfig = loadAuxConfig('codeTypeRusdiMaslim');
  const hubertusCodeTypeConfig = loadAuxConfig('codeTypeHubertus');
  const settings = loadAdminSettings();
  const tokens = readAdminJson<AccessToken[]>(ADMIN_STORAGE_KEYS.accessTokens, []);
  const users = getUsers();
  const logs = getAuditLogs();

  const summary = useMemo(() => {
    const scoringValidation = validateScoringConfigAdmin(config, questions);
    const normValidation = validateNormTable(normTable, config);
    const interpretationValidation = validateInterpretationConfig(interpretationConfig);
    const today = new Date().toISOString().slice(0, 10);
    return {
      scoringValidation,
      normValidation,
      interpretationValidation,
      completed: results.filter((result) => result.status === 'Selesai').length,
      reviewReports: results.filter((result) => result.status === 'Perlu Review' || !result.specialistReview || result.specialistReview.status === 'pending').length,
      finalReports: results.filter((result) => result.specialistReview?.status === 'finalized').length,
      tokensAvailable: tokens.filter((token) => token.status === 'unused').length,
      tokensActive: tokens.filter((token) => token.status === 'active').length,
      testingNow: tokens.filter((token) => token.status === 'active').length,
      completedToday: results.filter((result) => result.submittedAt.startsWith(today)).length,
      notStarted: tokens.filter((token) => token.status === 'unused').length,
      caution: results.filter((result) => result.validityStatus?.status === 'caution').length,
      invalid: results.filter((result) => result.validityStatus?.status === 'invalid' || result.validityStatus?.requiresRetest).length,
      reviewed: results.filter((result) => result.specialistReview?.status === 'reviewed').length,
    };
  }, [config, interpretationConfig, normTable, questions, results, tokens]);

  if (!user) return <AccessDenied />;

  const superadminDashboard = <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><StatCard label="Jumlah user" value={users.length} /><StatCard label="Jumlah token" value={tokens.length} /><StatCard label="Peserta selesai" value={summary.completed} tone="teal" /><StatCard label="Status bank soal" value={questions.length === 567 ? 'Siap' : 'Belum siap'} tone={questions.length === 567 ? 'teal' : 'rose'} /><StatCard label="Status scoringConfig" value={summary.scoringValidation.valid ? 'Valid' : 'Belum valid'} tone={summary.scoringValidation.valid ? 'teal' : 'rose'} /><StatCard label="Status normTable" value={summary.normValidation.valid && normTable ? 'Ada' : 'Belum lengkap'} tone={summary.normValidation.valid && normTable ? 'teal' : 'amber'} /><StatCard label="Status interpretationConfig" value={summary.interpretationValidation.valid ? 'Ada' : 'Belum lengkap'} tone={summary.interpretationValidation.valid ? 'teal' : 'amber'} /><StatCard label="Perlu telaah" value={summary.reviewReports} tone="amber" /><StatCard label="Laporan final" value={summary.finalReports} tone="teal" /></div><SystemReadinessCheck questions={questions} scoringConfig={config} normTable={normTable} interpretationConfig={interpretationConfig} codeTypeConfig={codeTypeConfig} settings={settings} /><Card><h3 className="text-xl font-black">Audit log terbaru</h3><div className="mt-4 grid gap-2">{logs.slice(0, 5).map((log) => <div key={log.logId} className="rounded-2xl border border-slate-100 p-3 text-sm dark:border-slate-800"><strong>{log.action}</strong> — {log.description}<br /><span className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString('id-ID')} oleh {log.username}</span></div>)}{logs.length === 0 && <p className="text-sm text-slate-500">Belum ada audit log.</p>}</div></Card></div>;
  const testerDashboard = <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><StatCard label="Token tersedia" value={summary.tokensAvailable} /><StatCard label="Token aktif" value={summary.tokensActive} tone="teal" /><StatCard label="Peserta sedang tes" value={summary.testingNow} tone="amber" /><StatCard label="Peserta selesai hari ini" value={summary.completedToday} tone="teal" /><StatCard label="Peserta belum mulai" value={summary.notStarted} /><StatCard label="Hasil menunggu telaah" value={summary.reviewReports} tone="amber" /></div><Card><h2 className="text-xl font-black">Aksi cepat tester</h2><div className="mt-4 flex flex-wrap gap-3"><Button onClick={() => navigate('/admin/tokens')}>Buat token</Button><Button variant="ghost" onClick={() => navigate('/admin/tokens')}>Cetak kartu token</Button><Button variant="secondary" onClick={() => navigate('/admin/results')}>Lihat status peserta</Button></div></Card></div>;
  const specialistDashboard = <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><StatCard label="Perlu telaah" value={summary.reviewReports} tone="amber" /><StatCard label="Perhatian" value={summary.caution} tone="amber" /><StatCard label="Invalid/tes ulang" value={summary.invalid} tone="rose" /><StatCard label="Sudah ditelaah" value={summary.reviewed} tone="teal" /><StatCard label="Laporan final" value={summary.finalReports} tone="teal" /></div><Card><h2 className="text-xl font-black">Aksi cepat spesialis</h2><div className="mt-4 flex flex-wrap gap-3"><Button onClick={() => navigate('/admin/review')}>Telaah hasil terbaru</Button><Button variant="secondary" onClick={() => navigate('/admin/review')}>Cetak laporan final</Button><Button variant="ghost" onClick={() => navigate('/admin/review')}>Tambah catatan klinis</Button></div></Card></div>;
  const dashboard = user.role === 'superadmin' ? superadminDashboard : user.role === 'tester' ? testerDashboard : specialistDashboard;
  const configPage = <PermissionGuard permission="config.importQuestions"><div className="space-y-6"><ImportQuestionsPanel questions={questions} onRefresh={refresh} toast={() => undefined} /><ImportScoringPanel questions={questions} config={config} onRefresh={refresh} toast={() => undefined} /><ImportNormPanel normTable={normTable} config={config} onRefresh={refresh} toast={() => undefined} /><ImportInterpretationPanel config={interpretationConfig} onRefresh={refresh} toast={() => undefined} /><ImportCodeTypePanel config={codeTypeConfig} onRefresh={refresh} toast={() => undefined} /></div></PermissionGuard>;
  const interpretationConfigPage = <PermissionGuard permission="config.importQuestions"><InterpretationConfigPanel rusdiConfig={rusdiConfig} hubertusConfig={hubertusConfig} rusdiCodeTypeConfig={rusdiCodeTypeConfig} hubertusCodeTypeConfig={hubertusCodeTypeConfig} scoringConfig={config} onRefresh={refresh} toast={() => undefined} /></PermissionGuard>;
  const resultsPage = <PermissionGuard permission="results.readAdministrative"><ResultsManagementPanel results={user.role === 'tester' ? results.map((result) => ({ ...result, scores: [], interpretations: undefined, clinicalSummary: undefined, recommendations: [] })) : results} onRefresh={refresh} openResult={openResult} toast={() => undefined} /></PermissionGuard>;

  const content = currentPath === '/admin/users' ? <PermissionGuard permission="users.read"><UserManagementPage /></PermissionGuard>
    : currentPath === '/admin/tokens' ? <PermissionGuard permission="tokens.create"><TokenManagementPanel results={results} toast={() => undefined} /></PermissionGuard>
    : currentPath === '/admin/config' ? configPage
    : currentPath === '/admin/interpretations' ? interpretationConfigPage
    : currentPath === '/admin/results' ? resultsPage
    : currentPath === '/admin/review' ? <PermissionGuard permission="review.create"><SpecialistReviewPage results={results} onRefresh={refresh} /></PermissionGuard>
    : currentPath === '/admin/settings' ? <PermissionGuard permission="system.reset"><AdminSettingsPanel onRefresh={refresh} toast={() => undefined} /></PermissionGuard>
    : currentPath === '/admin/backup' ? <PermissionGuard permission="backup.export"><BackupRestorePanel onRefresh={refresh} toast={() => undefined} /></PermissionGuard>
    : currentPath === '/admin/audit' ? <PermissionGuard permission="audit.read"><AuditLogPanel /></PermissionGuard>
    : dashboard;

  return <div className="mx-auto max-w-7xl px-4 py-8"><div className="mb-6 space-y-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-wide text-teal-700">Admin Dashboard</p><h1 className="text-2xl font-black sm:text-3xl">Asesmen MMPI TNI AU / SPPG</h1><p className="text-slate-500">Akses terkelola untuk Superadmin, Tester, dan Spesialis.</p></div><div className="flex flex-wrap items-center gap-2"><Badge tone="teal">Admin Panel</Badge><RoleBadge role={user.role} /><span className="text-sm font-bold">{user.displayName}</span><Button variant="ghost" onClick={refresh}>Refresh</Button><Button variant="danger" onClick={() => { logoutUser(); navigate('/admin/login'); }}>Logout</Button></div></div></div><div className="grid gap-6 lg:grid-cols-[260px_1fr]"><AdminSidebar user={user} currentPath={currentPath} navigate={navigate} /><section className="min-w-0">{content}</section></div></div>;
};
