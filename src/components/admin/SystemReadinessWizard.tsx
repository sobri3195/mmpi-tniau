import { useMemo, useState } from 'react';
import { Button, Card } from '../ui';
import { autoFixConfigStructure, getSystemReadinessStatus, markSystemReadyForInterpretation, validateAllConfigs } from '../../utils/systemReadiness';
import type { AutoFixResult, SystemReadinessStatus } from '../../utils/systemReadiness';
import { writeAdminJson } from '../../utils/adminStorage';
import { ConfigStatusCard } from './ConfigStatusCard';
import { ReadinessChecklist } from './ReadinessChecklist';
import { MissingConfigPanel } from './MissingConfigPanel';
import { AutoFixConfigModal } from './AutoFixConfigModal';
import { ReadyForInterpretationBanner } from './ReadyForInterpretationBanner';
import { ConfigValidationDetail } from './ConfigValidationDetail';

const templateMap: Record<string, unknown> = {
  'template_questions.json': [{ id: 1, number: 1, code: 'Q001', text: 'PLACEHOLDER - ganti dengan item resmi/berizin.', responseType: 'plus_minus', options: [{ label: '+', value: '+' }, { label: '-', value: '-' }], required: true }],
  'template_scoringConfig.json': { instrumentName: 'MMPI-2', version: 'DUMMY_TEMPLATE', totalItems: 567, scales: [{ id: 'L', code: 'L', name: 'PLACEHOLDER', group: 'validity', items: [{ questionId: 1, scoredResponse: '+', point: 1 }] }] },
  'template_normTable.json': { version: 'DUMMY_TEMPLATE', general: true, scales: [{ scaleId: 'L', conversions: [{ raw: 0, tScore: 50 }] }] },
  'template_interpretation_rusdi_maslim.json': { sourceName: 'Rusdi Maslim', version: 'DUMMY_TEMPLATE', isDemo: true, validityInterpretations: {}, scaleInterpretations: {}, codeTypeInterpretations: {}, domainInterpretations: {}, recommendationRules: {}, appendix: {} },
  'template_interpretation_hubertus.json': { sourceName: 'Hubertus', version: 'DUMMY_TEMPLATE', isDemo: true, validityInterpretations: {}, scaleInterpretations: {}, codeTypeInterpretations: {}, domainInterpretations: {}, recommendationRules: {}, appendix: {} },
  'template_codeTypeConfig.json': [{ code: '12/21', title: 'PLACEHOLDER', interpretation: 'PLACEHOLDER', cautionNotes: ['PLACEHOLDER'], recommendation: 'PLACEHOLDER' }],
  'template_summaryAnalysisConfig.json': { configName: 'DUMMY_TEMPLATE', version: 'DUMMY_TEMPLATE', isDemo: true, validityAttitude: {}, mentalCapacityIndex: { variables: [], categoryRules: [] }, clinicalProfile: {}, basicPersonalityIndex: { variables: [], categoryRules: [] }, conclusionTemplates: {} },
  'template_reportTemplate.json': { institutionHeader: true, participantIdentity: true, startedAt: true, completedAt: true, duration: true, totalItems: true, answeredItems: true, scoreChart: true, scoreTable: true, rusdiMaslimInterpretation: true, hubertusInterpretation: true, interpretationComparison: true, summaryAnalysis: true, rhScreening: true, rhRedFlags: true, specialistNotes: true, finalSpecialistConclusion: true, examinerSignature: true, disclaimer: true },
};

const downloadTemplate = (name: string) => {
  const blob = new Blob([JSON.stringify(templateMap[name], null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
};

export const SystemReadinessWizard = ({ onRefresh, navigate }: { onRefresh: () => void; navigate: (path: string) => void }) => {
  const [status, setStatus] = useState<SystemReadinessStatus>(() => getSystemReadinessStatus());
  const [autoFix, setAutoFix] = useState<AutoFixResult | null>(null);
  const validations = useMemo(() => Object.values(status.validations), [status]);
  const reload = () => setStatus(getSystemReadinessStatus());
  const runValidation = () => { validateAllConfigs(); reload(); };
  const previewAutoFix = () => setAutoFix(autoFixConfigStructure());
  const applyAutoFix = () => {
    const result = autoFixConfigStructure(undefined, undefined, true);
    setAutoFix(result);
    runValidation();
    onRefresh();
  };
  const markReady = () => {
    const next = markSystemReadyForInterpretation();
    writeAdminJson('sppg_mmpi2_system_readiness', next);
    setStatus(next);
  };
  return <div className="space-y-6">
    <ReadyForInterpretationBanner status={status} />
    <Card>
      <p className="text-sm font-bold uppercase tracking-wide text-teal-700">Admin</p>
      <h2 className="text-2xl font-black">Wizard Siap Interpretasi</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">Wizard ini memvalidasi seluruh konfigurasi MMPI TNI AU/SPPG. Jika data klinis belum tersedia, admin harus mengimpor file resmi/berizin; sistem tidak membuat scoring, norma, interpretasi, code type, atau formula palsu.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={runValidation}>Validasi Semua</Button>
        <Button variant="secondary" onClick={previewAutoFix}>Auto-Fix Struktur</Button>
        <Button variant="ghost" onClick={() => navigate('/admin/config')}>Import Config yang Kurang</Button>
        <Button variant="ghost" onClick={runValidation}>Revalidasi</Button>
        <Button disabled={!status.systemReadyForInterpretation} onClick={markReady}>Tandai Sistem Siap Interpretasi</Button>
      </div>
    </Card>
    <ReadinessChecklist status={status} />
    <div className="grid gap-4 lg:grid-cols-2">{validations.map((validation) => <ConfigStatusCard key={validation.key} result={validation} onFix={() => navigate(validation.importKey?.includes('user') ? '/admin/users' : '/admin/config')} />)}</div>
    <MissingConfigPanel items={status.missingChecklist} onImport={() => navigate('/admin/config')} />
    <Card><h3 className="text-xl font-black">Download template dummy</h3><p className="mt-1 text-sm text-slate-500">Template berikut hanya placeholder/dummy dan wajib diganti isi resmi/berizin oleh admin.</p><div className="mt-4 flex flex-wrap gap-2">{Object.keys(templateMap).map((name) => <Button key={name} variant="ghost" onClick={() => downloadTemplate(name)}>{name}</Button>)}</div></Card>
    <div className="grid gap-4">{validations.map((validation) => <ConfigValidationDetail key={`detail-${validation.key}`} result={validation} />)}</div>
    <AutoFixConfigModal result={autoFix} onApply={applyAutoFix} onClose={() => setAutoFix(null)} />
  </div>;
};
