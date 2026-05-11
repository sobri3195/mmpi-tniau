import { useState } from 'react';
import type { ScoringConfig } from '../../types';
import { Button, Card } from '../ui';
import { downloadFile } from '../../utils/export';
import { clearAdminDataKey, saveAuxConfig } from '../../utils/adminStorage';
import { getNormScaleKeys, validateNormTable, type ValidationResult } from '../../utils/configValidation';
import { EmptyState, PanelTitle, TemplateButton, ValidationMessages } from './AdminCommon';

const templateNorm = [{ scaleId: 'placeholder_validity', general: true, conversions: [{ raw: 0, tScore: 50 }, { raw: 1, tScore: 55 }] }, { code: 'CLIN_PLACEHOLDER', gender: 'all', ageRange: '18+', conversions: [{ raw: 0, tScore: 50 }] }];
const asRows = (value: unknown) => Array.isArray(value) ? value : Object.values((value as Record<string, unknown>) ?? {});

export const ImportNormPanel = ({ normTable, config, onRefresh, toast }: { normTable: unknown; config: ScoringConfig | null; onRefresh: () => void; toast: (message: string, tone?: 'teal' | 'amber' | 'rose') => void }) => {
  const [draft, setDraft] = useState<unknown | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(normTable ? validateNormTable(normTable, config) : null);
  const active = draft ?? normTable;
  const rows = asRows(active).slice(0, 8);
  const normKeys = getNormScaleKeys(active);
  const missingCount = (config?.scales ?? []).filter((scale) => !normKeys.has(scale.id) && !normKeys.has(scale.code ?? '')).length;

  const importFile = async (file?: File) => {
    if (!file) return;
    const parsed = JSON.parse(await file.text());
    const result = validateNormTable(parsed, config);
    setDraft(parsed); setValidation(result); toast(result.valid ? 'Norma T-score terbaca.' : 'Norma memiliki error.', result.valid ? 'teal' : 'rose');
  };

  return <Card><PanelTitle title="Impor norma T-score" subtitle="Unggah normTable.json untuk konversi raw score ke T-score per skala, gender/usia/norma umum bila tersedia." />
    <div className="grid gap-3 sm:flex sm:flex-wrap"><input className="block w-full text-sm sm:w-auto" type="file" accept=".json" onChange={(event) => importFile(event.target.files?.[0]).catch((error) => { setValidation({ valid: false, errors: [error instanceof Error ? error.message : 'Gagal membaca file.'], warnings: [] }); toast('Gagal mengimpor norma.', 'rose'); })} /><TemplateButton filename="template_normTable.json" data={templateNorm} /><Button variant="ghost" onClick={() => { const result = validateNormTable(active, config); setValidation(result); toast('Validasi norma selesai.', result.valid ? 'teal' : 'rose'); }}>Validasi ulang</Button></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950"><p className="text-xs font-bold uppercase text-slate-500">Skala dengan norma</p><p className="text-2xl font-black">{normKeys.size}</p></div><div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950"><p className="text-xs font-bold uppercase text-slate-500">Skala tanpa norma</p><p className="text-2xl font-black">{missingCount}</p></div></div>
    <div className="mt-4"><ValidationMessages result={validation} /></div>
    <div className="mt-5">{rows.length ? <pre className="max-h-80 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(rows, null, 2)}</pre> : <EmptyState title="Belum ada norma T-score" />}</div>
    <div className="mt-5 flex flex-wrap gap-3"><Button disabled={!draft || !validation?.valid} onClick={() => { if (draft !== null) saveAuxConfig('normTable', draft); setDraft(null); onRefresh(); toast('Norma T-score disimpan.', 'teal'); }}>Simpan norma T-score</Button><Button variant="danger" onClick={() => { clearAdminDataKey('normTable'); onRefresh(); toast('Norma dihapus.', 'amber'); }}>Hapus norma</Button><Button variant="secondary" disabled={!active} onClick={() => downloadFile('normTable-export.json', JSON.stringify(active, null, 2))}>Ekspor norma</Button></div>
  </Card>;
};
