import { useEffect, useMemo, useState } from 'react';
import type { ScoringConfig, SourceCodeTypeConfig, SourceInterpretationConfig } from '../../types';
import { Badge, Button, Card, Select } from '../ui';
import { downloadFile } from '../../utils/export';
import { clearAdminDataKey, saveAuxConfig } from '../../utils/adminStorage';
import { createDefaultCodeTypeConfig, ensureInterpretationConfigsExist, restoreAutoDefaultInterpretationConfig, validateHubertusConfig, validateRusdiConfig, type InterpretationSourceName } from '../../utils/sourceInterpretations';
import type { ValidationResult } from '../../utils/configValidation';
import { EmptyState, PanelTitle, TemplateButton, ValidationMessages } from './AdminCommon';

const template = (sourceName: InterpretationSourceName): SourceInterpretationConfig => ({
  sourceName,
  version: 'admin-imported',
  isDemo: false,
  isAutoDefault: false,
  isOfficial: false,
  validityInterpretations: {},
  scaleInterpretations: {},
  codeTypeInterpretations: {},
  domainInterpretations: {},
  recommendationRules: {},
  appendix: {},
});

type SourceKey = 'rusdi_maslim' | 'hubertus';
const meta = {
  rusdi_maslim: { label: 'Rusdi Maslim', interpretationKey: 'interpretationRusdiMaslim', codeTypeKey: 'codeTypeRusdiMaslim', validate: validateRusdiConfig, template: template('Rusdi Maslim') },
  hubertus: { label: 'Hubertus', interpretationKey: 'interpretationHubertus', codeTypeKey: 'codeTypeHubertus', validate: validateHubertusConfig, template: template('Hubertus') },
} as const;

export const InterpretationConfigPanel = ({ rusdiConfig, hubertusConfig, rusdiCodeTypeConfig, hubertusCodeTypeConfig, scoringConfig, onRefresh, toast }: { rusdiConfig: unknown; hubertusConfig: unknown; rusdiCodeTypeConfig: unknown; hubertusCodeTypeConfig: unknown; scoringConfig: ScoringConfig | null; onRefresh: () => void; toast: (message: string, tone?: 'teal' | 'amber' | 'rose') => void }) => {
  useEffect(() => { if (ensureInterpretationConfigsExist(scoringConfig)) onRefresh(); }, [onRefresh, scoringConfig]);
  return <div className="space-y-6">
    <Card><PanelTitle title="Konfigurasi Interpretasi" subtitle="Interpretasi Rusdi Maslim dan Hubertus otomatis memiliki auto-default generik untuk preview teknis. Admin tetap dapat mengganti dengan konfigurasi resmi/berizin; auto-default bukan interpretasi resmi final." /></Card>
    <SourcePanel source="rusdi_maslim" config={rusdiConfig} codeTypeConfig={rusdiCodeTypeConfig} scoringConfig={scoringConfig} onRefresh={onRefresh} toast={toast} />
    <SourcePanel source="hubertus" config={hubertusConfig} codeTypeConfig={hubertusCodeTypeConfig} scoringConfig={scoringConfig} onRefresh={onRefresh} toast={toast} />
  </div>;
};

const statusLabel = (config: Partial<SourceInterpretationConfig> | null, validation: ValidationResult) => {
  if (!config) return 'Belum tersedia';
  if (!validation.valid) return 'Tidak valid';
  if (config.isOfficial) return 'Resmi/berizin';
  if (config.isVerified) return 'Diverifikasi admin';
  if (config.isAutoDefault) return 'Auto-default tersedia';
  return 'Perlu verifikasi';
};

const SourcePanel = ({ source, config, codeTypeConfig, scoringConfig, onRefresh, toast }: { source: SourceKey; config: unknown; codeTypeConfig: unknown; scoringConfig: ScoringConfig | null; onRefresh: () => void; toast: (message: string, tone?: 'teal' | 'amber' | 'rose') => void }) => {
  const info = meta[source];
  const [draft, setDraft] = useState<unknown | null>(null);
  const [codeDraft, setCodeDraft] = useState<unknown | null>(null);
  const active = draft ?? config;
  const activeConfig = active as Partial<SourceInterpretationConfig> | null;
  const activeCodeType = (codeDraft ?? codeTypeConfig) as Partial<SourceCodeTypeConfig> | null;
  const [scalePreview, setScalePreview] = useState('');
  const validation = useMemo<ValidationResult>(() => info.validate(active, scoringConfig), [active, info, scoringConfig]);
  const scaleKeys = Object.keys(((active as SourceInterpretationConfig | null)?.scaleInterpretations ?? {}) as Record<string, unknown>);
  const codeRules = activeCodeType?.rules ?? Object.keys(((active as SourceInterpretationConfig | null)?.codeTypeInterpretations ?? {}) as Record<string, unknown>);
  const codeTypeKeys = Array.isArray(codeRules) ? codeRules.map((_, index) => `rule-${index + 1}`) : Object.keys(codeRules ?? {});
  const readFile = async (file: File | undefined, setter: (value: unknown) => void) => { if (!file) return; setter(JSON.parse(await file.text())); };
  const previewValue = scalePreview ? ((active as SourceInterpretationConfig | null)?.scaleInterpretations ?? {})[scalePreview] : null;
  const currentStatus = statusLabel(activeConfig, validation);
  const hasAutoDefault = Boolean(activeConfig?.isAutoDefault);
  const saveOfficial = () => {
    if (!active || hasAutoDefault) { toast('Tandai resmi/berizin hanya untuk config yang benar-benar diimpor atau diisi resmi.', 'amber'); return; }
    saveAuxConfig(info.interpretationKey, { ...(active as Record<string, unknown>), isOfficial: true, isAutoDefault: false, licenseStatus: 'official_or_licensed_by_admin', officialMarkedAt: new Date().toISOString() });
    onRefresh(); toast(`Interpretasi ${info.label} ditandai resmi/berizin oleh admin.`, 'teal');
  };
  return <Card>
    <PanelTitle title={`Impor interpretasi ${info.label}`} subtitle={`Unggah interpretationConfig dan codeTypeConfig ${info.label}. Auto-default hanya narasi generik non-diagnostik, bukan konten manual asli dan bukan interpretasi resmi final.`} />
    <div className="mt-4 flex flex-wrap gap-2">
      <Badge tone={hasAutoDefault ? 'amber' : validation.valid ? 'teal' : 'rose'}>{hasAutoDefault ? 'Auto-default / belum diverifikasi manual' : currentStatus}</Badge>
      <Badge tone="slate">Status: {hasAutoDefault ? 'Perlu verifikasi admin/spesialis' : currentStatus}</Badge>
      {hasAutoDefault && <Badge tone="amber">Belum final/resmi</Badge>}
    </div>
    <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 dark:bg-slate-800">
      <p className="font-bold">Config {info.label} {hasAutoDefault ? 'auto-default tersedia.' : validation.valid ? 'tersedia.' : 'belum tersedia/tidak valid.'}</p>
      <p>Status: {hasAutoDefault ? 'Perlu verifikasi admin/spesialis.' : currentStatus}</p>
      <p>{scaleKeys.length ? 'Preview interpretasi generik tersedia. Siap untuk preview teknis.' : 'Preview interpretasi generik akan tersedia setelah auto-default dibuat dari scoringConfig.'}</p>
      <p>{(activeCodeType?.isAutoDefault || !codeTypeKeys.length) ? 'Code type spesifik belum tersedia, tetapi struktur config valid.' : 'Code type config tersedia.'}</p>
    </div>
    <div className="mt-4 grid gap-3 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        <h3 className="font-black">Impor interpretationConfig {info.label}</h3>
        <div className="mt-3 flex flex-wrap gap-3"><input className="block w-full text-sm sm:w-auto" type="file" accept=".json" onChange={(event) => readFile(event.target.files?.[0], setDraft).then(() => toast(`Konfigurasi ${info.label} terbaca.`, 'teal')).catch((error) => toast(error instanceof Error ? error.message : 'Gagal mengimpor konfigurasi.', 'rose'))} /><TemplateButton filename={`template_interpretasi_${source}.json`} data={info.template} /><Button variant="ghost" onClick={() => toast(validation.valid ? 'Validasi konfigurasi berhasil.' : 'Validasi menemukan masalah.', validation.valid ? 'teal' : 'amber')}>Validasi</Button></div>
        <div className="mt-4"><ValidationMessages result={validation} /></div>
        <div className="mt-4 flex flex-wrap gap-3"><Button disabled={!draft || !validation.valid} onClick={() => { saveAuxConfig(info.interpretationKey, draft); setDraft(null); onRefresh(); toast(`Interpretasi ${info.label} disimpan.`, 'teal'); }}>Simpan</Button><Button variant="secondary" disabled={!active} onClick={() => downloadFile(`interpretasi-${source}.json`, JSON.stringify(active, null, 2))}>Ekspor</Button><Button variant="danger" onClick={() => { clearAdminDataKey(info.interpretationKey); onRefresh(); toast(`Interpretasi ${info.label} dihapus. Auto-default akan dibuat ulang saat panel dibuka/refresh.`, 'amber'); }}>Hapus</Button><Button variant="secondary">Ganti dengan config resmi</Button></div>
      </div>
      <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        <h3 className="font-black">Impor codeTypeConfig {info.label}</h3>
        <div className="mt-3 flex flex-wrap gap-3"><input className="block w-full text-sm sm:w-auto" type="file" accept=".json" onChange={(event) => readFile(event.target.files?.[0], setCodeDraft).then(() => toast(`Code type ${info.label} terbaca.`, 'teal')).catch((error) => toast(error instanceof Error ? error.message : 'Gagal mengimpor code type.', 'rose'))} /><Button disabled={!codeDraft} onClick={() => { saveAuxConfig(info.codeTypeKey, codeDraft); setCodeDraft(null); onRefresh(); toast(`Code type ${info.label} disimpan.`, 'teal'); }}>Simpan code type</Button><Button variant="secondary" disabled={!codeTypeConfig && !codeDraft} onClick={() => downloadFile(`code-type-${source}.json`, JSON.stringify(codeDraft ?? codeTypeConfig, null, 2))}>Ekspor</Button><Button variant="danger" onClick={() => { clearAdminDataKey(info.codeTypeKey); onRefresh(); toast(`Code type ${info.label} dihapus. Auto-default akan dibuat ulang saat panel dibuka/refresh.`, 'amber'); }}>Hapus</Button></div>
        <p className="mt-3 text-sm text-slate-500">Preview code type: {codeTypeKeys.length ? codeTypeKeys.slice(0, 12).join(', ') : 'Code type spesifik belum tersedia, tetapi struktur config valid.'}</p>
      </div>
    </div>
    <div className="mt-4 flex flex-wrap gap-3">
      <Button variant="ghost" onClick={() => { restoreAutoDefaultInterpretationConfig(info.label, scoringConfig); onRefresh(); toast(`Auto-default ${info.label} direstore.`, 'teal'); }}>Restore auto-default</Button>
      <Button variant="ghost" onClick={() => { restoreAutoDefaultInterpretationConfig(info.label, scoringConfig); onRefresh(); toast(`Auto-default ${info.label} dibuat ulang.`, 'teal'); }}>Buat Ulang Auto-Default</Button>
      <Button variant="secondary" disabled={!active || !validation.valid} onClick={() => { saveAuxConfig(info.interpretationKey, { ...(active as Record<string, unknown>), isVerified: true, verifiedAt: new Date().toISOString() }); onRefresh(); toast(`Interpretasi ${info.label} ditandai sudah diverifikasi.`, 'teal'); }}>Tandai Sudah Diverifikasi</Button>
      <Button variant="secondary" disabled={!active || hasAutoDefault} onClick={saveOfficial}>Tandai Sebagai Resmi/Berizin</Button>
      <Button variant="ghost" onClick={() => { saveAuxConfig(info.codeTypeKey, createDefaultCodeTypeConfig(info.label)); onRefresh(); toast(`Code type auto-default ${info.label} dibuat ulang.`, 'teal'); }}>Buat Ulang CodeType Auto-Default</Button>
    </div>
    <div className="mt-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
      <h3 className="font-black">Preview interpretasi per skala</h3>
      {scaleKeys.length ? <><Select className="mt-3 max-w-sm" value={scalePreview} onChange={(event) => setScalePreview(event.target.value)}><option value="">Pilih skala</option>{scaleKeys.map((key) => <option key={key} value={key}>{key}</option>)}</Select><pre className="mt-3 max-h-72 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(previewValue ?? active, null, 2)}</pre></> : <EmptyState title="Preview interpretasi generik belum tersedia. Perlu scoringConfig atau klik Buat Ulang Auto-Default." />}
    </div>
  </Card>;
};
