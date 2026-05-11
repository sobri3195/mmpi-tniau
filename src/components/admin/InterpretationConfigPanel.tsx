import { useMemo, useState } from 'react';
import type { ScoringConfig, SourceInterpretationConfig } from '../../types';
import { Button, Card, Select } from '../ui';
import { downloadFile } from '../../utils/export';
import { clearAdminDataKey, saveAuxConfig } from '../../utils/adminStorage';
import { validateHubertusConfig, validateRusdiConfig } from '../../utils/sourceInterpretations';
import type { ValidationResult } from '../../utils/configValidation';
import { EmptyState, PanelTitle, TemplateButton, ValidationMessages } from './AdminCommon';

const template = (sourceName: 'Rusdi Maslim' | 'Hubertus'): SourceInterpretationConfig => ({
  sourceName,
  version: 'admin-imported',
  isDemo: false,
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

export const InterpretationConfigPanel = ({ rusdiConfig, hubertusConfig, rusdiCodeTypeConfig, hubertusCodeTypeConfig, scoringConfig, onRefresh, toast }: { rusdiConfig: unknown; hubertusConfig: unknown; rusdiCodeTypeConfig: unknown; hubertusCodeTypeConfig: unknown; scoringConfig: ScoringConfig | null; onRefresh: () => void; toast: (message: string, tone?: 'teal' | 'amber' | 'rose') => void }) => (
  <div className="space-y-6">
    <Card><PanelTitle title="Konfigurasi Interpretasi" subtitle="Interpretasi Rusdi Maslim dan Hubertus diimpor terpisah oleh admin. Peserta tidak memilih versi interpretasi sebelum tes; satu jawaban peserta dapat ditelaah dengan dua konfigurasi di halaman hasil." /></Card>
    <SourcePanel source="rusdi_maslim" config={rusdiConfig} codeTypeConfig={rusdiCodeTypeConfig} scoringConfig={scoringConfig} onRefresh={onRefresh} toast={toast} />
    <SourcePanel source="hubertus" config={hubertusConfig} codeTypeConfig={hubertusCodeTypeConfig} scoringConfig={scoringConfig} onRefresh={onRefresh} toast={toast} />
  </div>
);

const SourcePanel = ({ source, config, codeTypeConfig, scoringConfig, onRefresh, toast }: { source: SourceKey; config: unknown; codeTypeConfig: unknown; scoringConfig: ScoringConfig | null; onRefresh: () => void; toast: (message: string, tone?: 'teal' | 'amber' | 'rose') => void }) => {
  const info = meta[source];
  const [draft, setDraft] = useState<unknown | null>(null);
  const [codeDraft, setCodeDraft] = useState<unknown | null>(null);
  const active = draft ?? config;
  const [scalePreview, setScalePreview] = useState('');
  const validation = useMemo<ValidationResult>(() => info.validate(active, scoringConfig), [active, info, scoringConfig]);
  const scaleKeys = Object.keys(((active as SourceInterpretationConfig | null)?.scaleInterpretations ?? {}) as Record<string, unknown>);
  const codeTypeKeys = Object.keys(((codeDraft ?? codeTypeConfig ?? (active as SourceInterpretationConfig | null)?.codeTypeInterpretations ?? {}) as Record<string, unknown>));
  const readFile = async (file: File | undefined, setter: (value: unknown) => void) => { if (!file) return; setter(JSON.parse(await file.text())); };
  const previewValue = scalePreview ? ((active as SourceInterpretationConfig | null)?.scaleInterpretations ?? {})[scalePreview] : null;
  return <Card>
    <PanelTitle title={`Impor interpretasi ${info.label}`} subtitle={`Unggah interpretationConfig dan codeTypeConfig ${info.label}. Nama sumber wajib “${info.label}”; konten manual tidak disertakan di kode sumber.`} />
    <div className="mt-4 grid gap-3 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        <h3 className="font-black">Impor interpretationConfig {info.label}</h3>
        <div className="mt-3 flex flex-wrap gap-3"><input className="block w-full text-sm sm:w-auto" type="file" accept=".json" onChange={(event) => readFile(event.target.files?.[0], setDraft).then(() => toast(`Konfigurasi ${info.label} terbaca.`, 'teal')).catch((error) => toast(error instanceof Error ? error.message : 'Gagal mengimpor konfigurasi.', 'rose'))} /><TemplateButton filename={`template_interpretasi_${source}.json`} data={info.template} /><Button variant="ghost" onClick={() => toast(validation.valid ? 'Validasi konfigurasi berhasil.' : 'Validasi menemukan masalah.', validation.valid ? 'teal' : 'amber')}>Validasi</Button></div>
        <div className="mt-4"><ValidationMessages result={validation} /></div>
        <div className="mt-4 flex flex-wrap gap-3"><Button disabled={!draft || !validation.valid} onClick={() => { saveAuxConfig(info.interpretationKey, draft); setDraft(null); onRefresh(); toast(`Interpretasi ${info.label} disimpan.`, 'teal'); }}>Simpan</Button><Button variant="secondary" disabled={!active} onClick={() => downloadFile(`interpretasi-${source}.json`, JSON.stringify(active, null, 2))}>Ekspor</Button><Button variant="danger" onClick={() => { clearAdminDataKey(info.interpretationKey); onRefresh(); toast(`Interpretasi ${info.label} dihapus.`, 'amber'); }}>Hapus</Button></div>
      </div>
      <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        <h3 className="font-black">Impor codeTypeConfig {info.label}</h3>
        <div className="mt-3 flex flex-wrap gap-3"><input className="block w-full text-sm sm:w-auto" type="file" accept=".json" onChange={(event) => readFile(event.target.files?.[0], setCodeDraft).then(() => toast(`Code type ${info.label} terbaca.`, 'teal')).catch((error) => toast(error instanceof Error ? error.message : 'Gagal mengimpor code type.', 'rose'))} /><Button disabled={!codeDraft} onClick={() => { saveAuxConfig(info.codeTypeKey, codeDraft); setCodeDraft(null); onRefresh(); toast(`Code type ${info.label} disimpan.`, 'teal'); }}>Simpan code type</Button><Button variant="secondary" disabled={!codeTypeConfig && !codeDraft} onClick={() => downloadFile(`code-type-${source}.json`, JSON.stringify(codeDraft ?? codeTypeConfig, null, 2))}>Ekspor</Button><Button variant="danger" onClick={() => { clearAdminDataKey(info.codeTypeKey); onRefresh(); toast(`Code type ${info.label} dihapus.`, 'amber'); }}>Hapus</Button></div>
        <p className="mt-3 text-sm text-slate-500">Preview code type: {codeTypeKeys.length ? codeTypeKeys.slice(0, 12).join(', ') : 'Belum ada config.'}</p>
      </div>
    </div>
    <div className="mt-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
      <h3 className="font-black">Preview interpretasi per skala</h3>
      {scaleKeys.length ? <><Select className="mt-3 max-w-sm" value={scalePreview} onChange={(event) => setScalePreview(event.target.value)}><option value="">Pilih skala</option>{scaleKeys.map((key) => <option key={key} value={key}>{key}</option>)}</Select><pre className="mt-3 max-h-72 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(previewValue ?? active, null, 2)}</pre></> : <EmptyState title={`Interpretasi ${info.label} belum diimpor admin.`} />}
    </div>
  </Card>;
};
