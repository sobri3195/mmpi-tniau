import { useState } from 'react';
import { Button, Card } from '../ui';
import { downloadFile } from '../../utils/export';
import { clearAdminDataKey, saveAuxConfig } from '../../utils/adminStorage';
import { validateInterpretationConfig, type ValidationResult } from '../../utils/configValidation';
import { AlertBox, EmptyState, PanelTitle, TemplateButton, ValidationMessages } from './AdminCommon';

const template = { scaleInterpretations: { PLACEHOLDER: [{ minT: 50, maxT: 60, text: 'Placeholder - ganti dengan interpretasi resmi/berizin.' }] }, validityInterpretations: { valid: 'Placeholder validity interpretation.' }, generalRecommendations: ['Placeholder recommendation.'], codeTypeInterpretations: {}, redFlags: [], reviewRecommendations: [], retestRecommendations: [] };

export const ImportInterpretationPanel = ({ config, onRefresh, toast }: { config: unknown; onRefresh: () => void; toast: (message: string, tone?: 'teal' | 'amber' | 'rose') => void }) => {
  const [draft, setDraft] = useState<unknown | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(config ? validateInterpretationConfig(config) : null);
  const active = draft ?? config;
  const importFile = async (file?: File) => { if (!file) return; const parsed = JSON.parse(await file.text()); const result = validateInterpretationConfig(parsed); setDraft(parsed); setValidation(result); toast(result.valid ? 'Interpretation config terbaca.' : 'Interpretasi spesialis belum lengkap.', result.valid ? 'teal' : 'amber'); };
  return <Card><PanelTitle title="Import Interpretation Config" subtitle="Upload interpretationConfig.json untuk interpretasi skala, T-score range, validity profile, red flag, review, retest, dan rekomendasi klinis." />
    <AlertBox tone="amber">Interpretasi spesialis hanya aktif jika konfigurasi resmi/berizin lengkap dan bukan demo.</AlertBox>
    <div className="mt-4 grid gap-3 sm:flex sm:flex-wrap"><input className="block w-full text-sm sm:w-auto" type="file" accept=".json" onChange={(event) => importFile(event.target.files?.[0]).catch((error) => { setValidation({ valid: false, errors: [error instanceof Error ? error.message : 'Gagal membaca file.'], warnings: ['Interpretasi spesialis belum lengkap.'] }); toast('Gagal import interpretation config.', 'rose'); })} /><TemplateButton filename="template_interpretationConfig.json" data={template} /><Button variant="ghost" onClick={() => { const result = validateInterpretationConfig(active); setValidation(result); toast('Validasi interpretasi selesai.', result.valid ? 'teal' : 'amber'); }}>Validasi Ulang</Button></div>
    <div className="mt-4"><ValidationMessages result={validation} /></div>
    <div className="mt-5">{active ? <pre className="max-h-80 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(active, null, 2)}</pre> : <EmptyState title="Belum ada interpretationConfig" />}</div>
    <div className="mt-5 flex flex-wrap gap-3"><Button disabled={!draft || !validation?.valid} onClick={() => { if (draft !== null) saveAuxConfig('interpretationConfig', draft); setDraft(null); onRefresh(); toast('Interpretation config disimpan.', 'teal'); }}>Simpan Interpretation Config</Button><Button variant="danger" onClick={() => { clearAdminDataKey('interpretationConfig'); onRefresh(); toast('Interpretasi dihapus.', 'amber'); }}>Hapus</Button><Button variant="secondary" disabled={!active} onClick={() => downloadFile('interpretationConfig-export.json', JSON.stringify(active, null, 2))}>Export</Button></div>
  </Card>;
};
