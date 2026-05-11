import { useMemo, useState } from 'react';
import type { Question, ScoringConfig } from '../../types';
import { Button, Card, Badge } from '../ui';
import { downloadFile } from '../../utils/export';
import { clearAdminDataKey, saveAdminScoringConfig } from '../../utils/adminStorage';
import { validateScoringConfigAdmin, type ValidationResult } from '../../utils/configValidation';
import { PanelTitle, TemplateButton, ValidationMessages } from './AdminCommon';

const templateScoring = { instrument: 'MMPI-2 Placeholder - ganti dengan konfigurasi resmi/berizin', totalItems: 567, scales: [{ id: 'placeholder_validity', code: 'VAL_PLACEHOLDER', name: 'Validity Placeholder', group: 'validity', items: [{ questionId: 1, scoredResponse: true, point: 1 }], interpretationRules: [], tScoreConversion: [] }, { id: 'placeholder_clinical', code: 'CLIN_PLACEHOLDER', name: 'Clinical Placeholder', group: 'clinical', items: [{ questionId: 2, scoredResponse: false, point: 1 }], interpretationRules: [], tScoreConversion: [] }] };

export const ImportScoringPanel = ({ questions, config, onRefresh, toast }: { questions: Question[]; config: ScoringConfig | null; onRefresh: () => void; toast: (message: string, tone?: 'teal' | 'amber' | 'rose') => void }) => {
  const [draft, setDraft] = useState<ScoringConfig | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(config ? validateScoringConfigAdmin(config, questions) : null);
  const active = draft ?? config;
  const scales = active?.scales ?? [];
  const groups = useMemo(() => new Set(scales.map((scale) => String(scale.group ?? scale.type ?? 'other'))), [scales]);

  const importFile = async (file?: File) => {
    if (!file) return;
    const parsed = JSON.parse(await file.text()) as ScoringConfig;
    const result = validateScoringConfigAdmin(parsed, questions);
    setDraft(parsed);
    setValidation(result);
    toast(result.valid ? 'Scoring config terbaca.' : 'Scoring config memiliki error.', result.valid ? 'teal' : 'rose');
  };

  return <Card>
    <PanelTitle title="Import Scoring Config" subtitle="Upload scoringConfig.json. Kunci scoring MMPI asli tidak boleh disimpan di source code." status={<Badge tone={validation?.valid ? 'teal' : 'amber'}>{scales.length} skala</Badge>} />
    <div className="grid gap-3 sm:flex sm:flex-wrap"><input className="block w-full text-sm sm:w-auto" type="file" accept=".json" onChange={(event) => importFile(event.target.files?.[0]).catch((error) => { setValidation({ valid: false, errors: [error instanceof Error ? error.message : 'Gagal membaca file.'], warnings: [] }); toast('Gagal import scoring config.', 'rose'); })} /><TemplateButton filename="template_scoringConfig.json" data={templateScoring} /><Button variant="ghost" onClick={() => { const result = validateScoringConfigAdmin(active, questions); setValidation(result); toast('Validasi scoring selesai.', result.valid ? 'teal' : 'rose'); }}>Validasi Ulang</Button></div>
    <div className="mt-4"><ValidationMessages result={validation} /></div>
    <div className="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">{['validity', 'clinical', 'rc', 'content', 'supplementary', 'psy5'].map((group) => <div key={group} className="rounded-2xl bg-slate-50 p-3 text-sm dark:bg-slate-950"><p className="font-bold">{group}</p><p className={groups.has(group) ? 'text-teal-700' : 'text-amber-700'}>{groups.has(group) ? 'Ada' : 'Belum ada'}</p></div>)}</div>
    <div className="mt-5 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="p-2">Kode</th><th className="p-2">Nama Skala</th><th className="p-2">Group</th><th className="p-2">Jumlah Item</th><th className="p-2">T-score</th><th className="p-2">Rules</th></tr></thead><tbody>{scales.map((scale) => <tr key={scale.id} className="border-t border-slate-100 dark:border-slate-800"><td className="p-2 font-mono">{scale.code ?? '-'}</td><td className="p-2">{scale.name}</td><td className="p-2">{String(scale.group ?? scale.type ?? '-')}</td><td className="p-2">{scale.items?.length ?? 0}</td><td className="p-2">{scale.tScoreConversion?.length || scale.norms?.length ? 'Ada' : 'Belum ada norma T-score'}</td><td className="p-2">{scale.interpretationRules?.length ? 'Ada' : 'Belum ada'}</td></tr>)}</tbody></table></div>
    <div className="mt-5 flex flex-wrap gap-3"><Button disabled={!draft || !validation?.valid} onClick={() => { if (draft) saveAdminScoringConfig(draft); setDraft(null); onRefresh(); toast('Scoring config disimpan.', 'teal'); }}>Simpan Scoring Config</Button><Button variant="danger" onClick={() => { clearAdminDataKey('scoringConfig'); onRefresh(); toast('Scoring config dihapus.', 'amber'); }}>Hapus Scoring Config</Button><Button variant="secondary" disabled={!active} onClick={() => active && downloadFile('scoringConfig-export.json', JSON.stringify(active, null, 2))}>Export Scoring Config</Button></div>
  </Card>;
};
