import { useMemo, useState } from 'react';
import type { Question, ScoringConfig } from '../../types';
import { Button, Card, Badge } from '../ui';
import { downloadFile } from '../../utils/export';
import { clearAdminDataKey, readAdminJson, saveAdminScoringConfig, writeAdminJson, ADMIN_STORAGE_KEYS } from '../../utils/adminStorage';
import { validateScoringConfigAdmin, type ValidationResult } from '../../utils/configValidation';
import { AUTO_DEFAULT_LABEL, createAutoDefaultScoringConfig, isAutoDefaultScoring, restoreAutoDefaultScoringConfig, validateScoringConfig as validateAutoDefaultScoringConfig } from '../../utils/autoDefaultScoring';
import { PanelTitle, TemplateButton, ValidationMessages } from './AdminCommon';

const templateScoring = { instrument: 'MMPI-2 Placeholder - ganti dengan konfigurasi resmi/berizin', totalItems: 567, scales: [{ id: 'placeholder_validity', code: 'VAL_PLACEHOLDER', name: 'Validity Placeholder', group: 'validity', items: [{ questionId: 1, scoredResponse: '+', point: 1 }], interpretationRules: [], tScoreConversion: [] }, { id: 'placeholder_clinical', code: 'CLIN_PLACEHOLDER', name: 'Clinical Placeholder', group: 'clinical', items: [{ questionId: 2, scoredResponse: '-', point: 1 }], interpretationRules: [], tScoreConversion: [] }] };

export const ImportScoringPanel = ({ questions, config, onRefresh, toast }: { questions: Question[]; config: ScoringConfig | null; onRefresh: () => void; toast: (message: string, tone?: 'teal' | 'amber' | 'rose') => void }) => {
  const [draft, setDraft] = useState<ScoringConfig | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(config ? validateScoringConfigAdmin(config, questions) : null);
  const active = draft ?? config;
  const autoStatus = validateAutoDefaultScoringConfig(active, questions);
  const scales = active?.scales ?? [];
  const groups = useMemo(() => new Set(scales.map((scale) => String(scale.group ?? scale.type ?? 'other'))), [scales]);

  const importFile = async (file?: File) => {
    if (!file) return;
    const parsed = JSON.parse(await file.text()) as ScoringConfig;
    const result = validateScoringConfigAdmin(parsed, questions);
    setDraft({ ...parsed, isAutoDefault: false, isOfficial: parsed.isOfficial === true, replacedAutoDefaultAt: new Date().toISOString() } as ScoringConfig);
    setValidation(result);
    toast(result.valid ? 'Scoring config terbaca.' : 'Scoring config memiliki error.', result.valid ? 'teal' : 'rose');
  };

  return <Card>
    <PanelTitle title="Impor konfigurasi scoring" subtitle="Unggah scoringConfig.json. Kunci scoring MMPI asli tidak boleh disimpan di kode sumber. Auto-default hanya untuk scoring teknis." status={<Badge tone={isAutoDefaultScoring(active) ? 'amber' : validation?.valid ? 'teal' : 'amber'}>{isAutoDefaultScoring(active) ? 'Auto-default tersedia' : `${scales.length} skala`}</Badge>} />
    {isAutoDefaultScoring(active) && <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100"><p>{AUTO_DEFAULT_LABEL}</p><p className="mt-1">Status scoringConfig: Auto-default tersedia · Siap scoring teknis · Belum valid untuk laporan klinis final.</p><p className="mt-1">Keterangan: Bukan scoring resmi, perlu diganti/verifikasi untuk laporan final.</p></div>}
    <div className="mb-4 grid gap-2 rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-950"><p><strong>ScoringConfig auto-default tersedia</strong></p><p>Status: {autoStatus.readyForTechnicalScoring ? 'Siap scoring teknis' : 'Belum siap'}</p><p>Keterangan: {autoStatus.message}</p></div>
    <div className="grid gap-3 sm:flex sm:flex-wrap"><input className="block w-full text-sm sm:w-auto" type="file" accept=".json" onChange={(event) => importFile(event.target.files?.[0]).catch((error) => { setValidation({ valid: false, errors: [error instanceof Error ? error.message : 'Gagal membaca file.'], warnings: [] }); toast('Gagal mengimpor konfigurasi scoring.', 'rose'); })} /><TemplateButton filename="template_scoringConfig.json" data={templateScoring} /><Button variant="ghost" onClick={() => { const result = validateScoringConfigAdmin(active, questions); setValidation(result); writeAdminJson(ADMIN_STORAGE_KEYS.configValidationStatus, validateAutoDefaultScoringConfig(active, questions)); toast('Validasi scoring selesai.', result.valid ? 'teal' : 'rose'); }}>Validasi Ulang</Button></div>
    <div className="mt-4"><ValidationMessages result={validation} /></div>
    <div className="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">{['validity', 'clinical', 'rc', 'content', 'supplementary', 'psy5'].map((group) => <div key={group} className="rounded-2xl bg-slate-50 p-3 text-sm dark:bg-slate-950"><p className="font-bold">{group}</p><p className={groups.has(group) ? 'text-teal-700' : 'text-amber-700'}>{groups.has(group) ? 'Ada' : 'Belum ada'}</p></div>)}</div>
    <div className="mt-5 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="p-2">Kode</th><th className="p-2">Nama Skala</th><th className="p-2">Group</th><th className="p-2">Jumlah Item</th><th className="p-2">T-score</th><th className="p-2">Rules</th></tr></thead><tbody>{scales.map((scale) => <tr key={scale.id} className="border-t border-slate-100 dark:border-slate-800"><td className="p-2 font-mono">{scale.code ?? '-'}</td><td className="p-2">{scale.name}</td><td className="p-2">{String(scale.group ?? scale.type ?? '-')}</td><td className="p-2">{scale.items?.length ?? 0}</td><td className="p-2">{scale.tScoreConversion?.length || scale.norms?.length ? 'Ada' : 'Belum ada norma T-score'}</td><td className="p-2">{scale.interpretationRules?.length ? 'Ada' : 'Belum ada'}</td></tr>)}</tbody></table></div>
    <div className="mt-5 flex flex-wrap gap-3"><Button disabled={!draft || !validation?.valid} onClick={() => { if (draft) saveAdminScoringConfig(draft); setDraft(null); onRefresh(); toast('Scoring config disimpan.', 'teal'); }}>Simpan konfigurasi scoring</Button><Button variant="ghost" onClick={() => { restoreAutoDefaultScoringConfig(questions); setDraft(null); setValidation(validateScoringConfigAdmin(createAutoDefaultScoringConfig(questions), questions)); onRefresh(); toast('Auto-default scoring dibuat ulang.', 'amber'); }}>Buat Ulang Auto-Default Scoring</Button><Button variant="secondary" onClick={() => document.querySelector<HTMLInputElement>('input[type=file]')?.click()}>Ganti dengan ScoringConfig Resmi</Button><Button variant="secondary" disabled={!active} onClick={() => active && downloadFile('scoringConfig-auto-default-export.json', JSON.stringify(active, null, 2))}>Ekspor Auto-Default</Button><Button variant="ghost" disabled={!active} onClick={() => { const verifiedBy = window.prompt('Verified by / nama admin-spesialis:', 'Admin') || 'Admin'; const verificationNote = window.prompt('Catatan verifikasi:', 'Sudah ditinjau untuk penggunaan teknis; belum resmi kecuali config resmi diimpor.') || ''; const current = readAdminJson<ScoringConfig | null>(ADMIN_STORAGE_KEYS.scoringConfig, null); if (current) writeAdminJson(ADMIN_STORAGE_KEYS.scoringConfig, { ...current, verificationNote, verifiedBy, verifiedAt: new Date().toISOString(), isOfficial: current.isOfficial === true }); onRefresh(); toast('Catatan verifikasi disimpan. Status resmi tidak diubah.', 'teal'); }}>Tandai Sudah Diverifikasi</Button><Button variant="danger" onClick={() => { clearAdminDataKey('scoringConfig'); onRefresh(); toast('Scoring config dihapus.', 'amber'); }}>Hapus Config</Button></div>
  </Card>;
};
