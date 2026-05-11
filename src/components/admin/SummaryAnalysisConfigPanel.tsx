import { useEffect, useState } from 'react';
import type { ScoringConfig, SummaryAnalysisConfig } from '../../types';
import { Button, Card } from '../ui';
import { AUTO_DEFAULT_BADGE_LABEL, clearSummaryAnalysisConfig, createDefaultSummaryAnalysisConfig, ensureSummaryAnalysisConfigExists, exportSummaryAnalysisConfig, restoreAutoDefaultSummaryAnalysisConfig, saveSummaryAnalysisConfig, validateSummaryAnalysisConfig } from '../../utils/summaryAnalysis';
import { EmptyState, PanelTitle, TemplateButton, ValidationMessages } from './AdminCommon';

const template = createDefaultSummaryAnalysisConfig(null);

type Tone = 'teal' | 'amber' | 'rose';

export const SummaryAnalysisConfigPanel = ({ config, scoringConfig, onRefresh, toast }: { config: SummaryAnalysisConfig | null; scoringConfig: ScoringConfig | null; onRefresh: () => void; toast: (message: string, tone?: Tone) => void }) => {
  const [draft, setDraft] = useState<SummaryAnalysisConfig | null>(null);
  const active = draft ?? config;
  const [validation, setValidation] = useState(active ? validateSummaryAnalysisConfig(active, scoringConfig) : null);

  useEffect(() => {
    if (!config) {
      ensureSummaryAnalysisConfigExists(scoringConfig);
      onRefresh();
    }
  }, [config, scoringConfig, onRefresh]);

  useEffect(() => {
    setValidation(active ? validateSummaryAnalysisConfig(active, scoringConfig) : null);
  }, [active, scoringConfig]);

  const importFile = async (file?: File) => {
    if (!file) return;
    const parsed = JSON.parse(await file.text()) as SummaryAnalysisConfig;
    const imported = { ...parsed, isAutoDefault: parsed.isAutoDefault ?? false, isOfficial: parsed.isOfficial ?? true, isFinal: parsed.isFinal ?? false };
    const result = validateSummaryAnalysisConfig(imported, scoringConfig);
    setDraft(imported);
    setValidation(result);
    toast(result.valid ? 'summaryAnalysisConfig.json terbaca. Klik Simpan config untuk memakai config ini.' : 'Konfigurasi analisa perlu dilengkapi.', result.valid ? 'teal' : 'amber');
  };

  const updateDraft = (next: SummaryAnalysisConfig) => {
    setDraft(next);
    setValidation(validateSummaryAnalysisConfig(next, scoringConfig));
  };

  const markDemo = (isDemo: boolean) => {
    if (!active) return;
    updateDraft({ ...active, isDemo, isFinal: isDemo ? false : active.isFinal });
  };

  const markVerified = () => {
    if (!active) return;
    updateDraft({ ...active, verifiedBy: 'admin/spesialis', verifiedAt: new Date().toISOString(), verificationNote: active.verificationNote || 'Diverifikasi admin/spesialis melalui dashboard.', isFinal: active.isFinal ?? false });
    toast('Konfigurasi ditandai sudah diverifikasi. Tandai final kini dapat digunakan bila diperlukan.', 'teal');
  };

  const markFinal = () => {
    if (!active) return;
    const verified = Boolean(active.verifiedBy || active.verificationNote || active.isOfficial || !active.isAutoDefault);
    if (!verified) {
      toast('Auto-default belum dapat dijadikan final tanpa verifikasi spesialis/admin.', 'amber');
      setValidation({ ...validateSummaryAnalysisConfig(active, scoringConfig), valid: false, errors: ['Auto-default belum dapat dijadikan final tanpa verifikasi spesialis/admin.'] });
      return;
    }
    updateDraft({ ...active, isFinal: true, isDemo: false });
  };

  const restoreDefault = () => {
    const next = restoreAutoDefaultSummaryAnalysisConfig(scoringConfig);
    setDraft(null);
    setValidation(validateSummaryAnalysisConfig(next, scoringConfig));
    onRefresh();
    toast('Auto-default Analisa Ringkas dibuat ulang.', 'teal');
  };

  const canMarkFinal = Boolean(active && (!active.isAutoDefault || active.isOfficial || active.verifiedBy || active.verificationNote));

  return <Card><PanelTitle title="Konfigurasi Analisa Ringkas" subtitle="Config dapat diimpor resmi/berizin, tetapi sistem juga membuat auto-default generik untuk preview teknis agar aplikasi langsung berjalan." />
    {active?.isAutoDefault && <div className="mb-4 space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><span className="inline-flex rounded-full bg-amber-200 px-3 py-1 text-xs font-black uppercase tracking-wide">{AUTO_DEFAULT_BADGE_LABEL}</span><p className="font-black">Konfigurasi Analisa Ringkas auto-default tersedia.</p><p>Status: Perlu verifikasi admin/spesialis.</p><p>Formula: Auto-default generik, bukan formula resmi.</p><p>Siap preview teknis.</p></div>}
    {active?.isDemo && <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">Analisa Ringkas masih demo dan tidak valid untuk laporan final.</div>}
    {active?.isAutoDefault && !canMarkFinal && <div className="mb-4 rounded-2xl border border-amber-200 bg-white p-3 text-sm font-semibold text-amber-900">Auto-default belum dapat dijadikan final tanpa verifikasi spesialis/admin.</div>}
    <div className="grid gap-3 sm:flex sm:flex-wrap"><label className="inline-flex cursor-pointer items-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-50">Ganti dengan Config Resmi<input className="hidden" type="file" accept=".json" onChange={(event) => importFile(event.target.files?.[0]).catch((error) => { setValidation({ valid: false, errors: [error instanceof Error ? error.message : 'Gagal membaca file.'], warnings: [] }); toast('Gagal mengimpor summaryAnalysisConfig.', 'rose'); })} /></label><TemplateButton filename="summaryAnalysisConfig.json" data={template} /><Button variant="ghost" disabled={!active} onClick={() => active && setValidation(validateSummaryAnalysisConfig(active, scoringConfig))}>Validasi formula & sumber skala</Button><Button variant="ghost" disabled={!active} onClick={() => markDemo(true)}>Tandai demo</Button><Button variant="ghost" disabled={!active || !canMarkFinal} onClick={markFinal}>Tandai final</Button><Button variant="ghost" onClick={restoreDefault}>Buat Ulang Auto-Default</Button><Button variant="secondary" disabled={!active} onClick={markVerified}>Tandai Sudah Diverifikasi</Button></div>
    <div className="mt-4"><ValidationMessages result={validation} />{validation?.message && <p className="mt-2 text-sm font-semibold text-slate-600">{validation.message}</p>}</div>
    <div className="mt-5">{active ? <pre className="max-h-96 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(active, null, 2)}</pre> : <EmptyState title="Konfigurasi Analisa Ringkas auto-default sedang disiapkan"><p className="mt-2 text-sm text-slate-500">Sistem akan membuat auto-default otomatis tanpa menimpa config resmi/custom yang sudah ada.</p></EmptyState>}</div>
    <div className="mt-5 flex flex-wrap gap-3"><Button disabled={!draft || !validation?.valid} onClick={() => { if (draft) saveSummaryAnalysisConfig(draft); setDraft(null); onRefresh(); toast('Konfigurasi Analisa Ringkas disimpan.', 'teal'); }}>Simpan config</Button><Button variant="secondary" disabled={!active} onClick={() => exportSummaryAnalysisConfig(active)}>Export config</Button><Button variant="danger" onClick={() => { clearSummaryAnalysisConfig(); setDraft(null); setValidation(null); onRefresh(); toast('Konfigurasi Analisa Ringkas dihapus. Auto-default akan dibuat lagi saat dashboard dibuka/refresh.', 'amber'); }}>Hapus config</Button></div>
  </Card>;
};
