import { useState } from 'react';
import type { ScoringConfig, SummaryAnalysisConfig } from '../../types';
import { Button, Card } from '../ui';
import { downloadFile } from '../../utils/export';
import { clearSummaryAnalysisConfig, saveSummaryAnalysisConfig, validateSummaryAnalysisConfig } from '../../utils/summaryAnalysis';
import { EmptyState, PanelTitle, TemplateButton, ValidationMessages } from './AdminCommon';

const template: SummaryAnalysisConfig = {
  configName: 'Analisa Ringkas TNI AU',
  version: 'admin-imported',
  isDemo: false,
  validityAttitude: {
    sourceScales: ['L', 'F', 'K', 'VRIN', 'TRIN'],
    scoreRules: [
      { score: 0, label: 'Tidak valid', description: 'Tidak valid dan tidak dapat diinterpretasi sama sekali' },
      { score: 1, label: 'Masih valid dengan modifikasi', description: 'Masih valid dan dapat diinterpretasi dengan modifikasi' },
      { score: 2, label: 'Valid', description: 'Valid dan dapat diinterpretasi sepenuhnya' },
    ],
    narrativeTemplates: { '0': 'Responden menunjukkan pola respons yang tidak memadai untuk interpretasi. Hasil tes tidak disarankan untuk ditafsirkan lebih lanjut sebelum dilakukan review atau retest.', '1': 'Responden mengisi seluruh tes dengan lengkap, namun terdapat indikator yang memerlukan kehati-hatian. Dengan demikian, skor validitas adalah 1 dan hasil masih dapat diinterpretasi dengan modifikasi.', '2': 'Responden mengisi tes secara memadai dan profil dapat diinterpretasi sepenuhnya.' },
  },
  mentalCapacityIndex: { variables: [
    { id: 'potensi_kinerja', label: 'Potensi Kinerja', rangeDescription: '0=kurang, 1=sedang, 2=besar', formula: 'admin_config_formula', sourceScales: [] },
    { id: 'kemampuan_adaptasi', label: 'Kemampuan Adaptasi', rangeDescription: '0=kurang, 1=sedang, 2=besar', formula: 'admin_config_formula', sourceScales: [] },
    { id: 'kendala_psikologis', label: 'Kendala Psikologis', rangeDescription: '0=berat, 1=sedang, 2=ringan', formula: 'admin_config_formula', sourceScales: [] },
    { id: 'perilaku_berisiko', label: 'Perilaku Berisiko', rangeDescription: '0=besar, 1=sedang, 2=kecil', formula: 'admin_config_formula', sourceScales: [] },
    { id: 'integritas_moral', label: 'Integritas Moral', rangeDescription: '0=rendah, 1=sedang, 2=tinggi', formula: 'admin_config_formula', sourceScales: [] },
  ], totalScore: { min: 0, max: 10, label: 'Indeks Kapasitas Mental' }, categoryRules: [{ min: 0, max: 2, label: 'Sangat Buruk' }, { min: 3, max: 4, label: 'Buruk' }, { min: 5, max: 6, label: 'Sedang' }, { min: 7, max: 8, label: 'Baik' }, { min: 9, max: 10, label: 'Sangat Baik' }] },
  clinicalProfile: { sourceScales: [], narrativeRules: [{ condition: 'elevated_somatic', text: 'Gejala klinis somatik yang terkait dengan problem psikologis.' }, { condition: 'elevated_interpersonal', text: 'Gejala klinis yang terkait dengan kesulitan emosional dalam hubungan interpersonal.' }, { condition: 'elevated_suspiciousness', text: 'Gejala klinis yang terkait dengan pikiran kecurigaan yang berlebihan.' }, { condition: 'elevated_affect', text: 'Gejala klinis yang terkait dengan luapan perasaan yang berlebihan.' }] },
  basicPersonalityIndex: { name: 'Indeks Kepribadian Dasar', model: 'OCEAN', variables: [
    { id: 'openness', label: 'Keterbukaan Pikiran', englishLabel: 'Openness', rangeDescription: '0=kurang, 1=sedang, 2=besar', formula: 'admin_config_formula', sourceScales: [] },
    { id: 'conscientiousness', label: 'Keterbukaan Hati', englishLabel: 'Conscientiousness', rangeDescription: '0=kurang, 1=sedang, 2=besar', formula: 'admin_config_formula', sourceScales: [] },
    { id: 'extraversion', label: 'Keterbukaan terhadap Orang Lain', englishLabel: 'Extraversion', rangeDescription: '0=kurang, 1=sedang, 2=besar', formula: 'admin_config_formula', sourceScales: [] },
    { id: 'agreeableness', label: 'Keterbukaan terhadap Kesepakatan', englishLabel: 'Agreeableness', rangeDescription: '0=kurang, 1=sedang, 2=besar', formula: 'admin_config_formula', sourceScales: [] },
    { id: 'neuroticism', label: 'Keterbukaan terhadap Tekanan', englishLabel: 'Neuroticism', rangeDescription: '0=kurang, 1=sedang, 2=besar', formula: 'admin_config_formula', sourceScales: [] },
  ], totalScore: { min: 0, max: 10, label: 'Indeks OCEAN' }, categoryRules: [{ min: 0, max: 2, label: 'Sangat Buruk' }, { min: 3, max: 4, label: 'Buruk' }, { min: 5, max: 6, label: 'Sedang' }, { min: 7, max: 8, label: 'Baik' }, { min: 9, max: 10, label: 'Sangat Baik' }] },
  conclusionTemplates: { valid: 'Dengan merujuk pada skor validitas, indeks kapasitas mental, indeks kepribadian dasar, dan profil klinis, hasil ini dapat ditelaah lebih lanjut oleh pemeriksa berwenang.', caution: 'Dengan merujuk pada skor validitas, interpretasi perlu dilakukan secara hati-hati dan dikonfirmasi melalui wawancara klinis.', invalid: 'Profil belum memadai untuk kesimpulan final. Disarankan review atau retest oleh profesional berwenang.' },
};

export const SummaryAnalysisConfigPanel = ({ config, scoringConfig, onRefresh, toast }: { config: SummaryAnalysisConfig | null; scoringConfig: ScoringConfig | null; onRefresh: () => void; toast: (message: string, tone?: 'teal' | 'amber' | 'rose') => void }) => {
  const [draft, setDraft] = useState<SummaryAnalysisConfig | null>(null);
  const active = draft ?? config;
  const [validation, setValidation] = useState(active ? validateSummaryAnalysisConfig(active, scoringConfig) : null);
  const importFile = async (file?: File) => { if (!file) return; const parsed = JSON.parse(await file.text()) as SummaryAnalysisConfig; const result = validateSummaryAnalysisConfig(parsed, scoringConfig); setDraft(parsed); setValidation(result); toast(result.valid ? 'summaryAnalysisConfig.json terbaca.' : 'Konfigurasi analisa perlu dilengkapi.', result.valid ? 'teal' : 'amber'); };
  const markDemo = (isDemo: boolean) => { if (!active) return; const next = { ...active, isDemo }; setDraft(next); setValidation(validateSummaryAnalysisConfig(next, scoringConfig)); };
  return <Card><PanelTitle title="Konfigurasi Analisa Ringkas" subtitle="Import summaryAnalysisConfig.json untuk validity attitude, indeks kapasitas mental, profil klinis, OCEAN, dan template kesimpulan." />
    {active?.isDemo && <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">Analisa Ringkas masih demo dan tidak valid untuk laporan final.</div>}
    <div className="grid gap-3 sm:flex sm:flex-wrap"><input className="block w-full text-sm sm:w-auto" type="file" accept=".json" onChange={(event) => importFile(event.target.files?.[0]).catch((error) => { setValidation({ valid: false, errors: [error instanceof Error ? error.message : 'Gagal membaca file.'], warnings: [] }); toast('Gagal mengimpor summaryAnalysisConfig.', 'rose'); })} /><TemplateButton filename="summaryAnalysisConfig.json" data={template} /><Button variant="ghost" disabled={!active} onClick={() => active && setValidation(validateSummaryAnalysisConfig(active, scoringConfig))}>Validasi formula & sumber skala</Button><Button variant="ghost" disabled={!active} onClick={() => markDemo(true)}>Tandai demo</Button><Button variant="ghost" disabled={!active} onClick={() => markDemo(false)}>Tandai final</Button></div>
    <div className="mt-4"><ValidationMessages result={validation} /></div>
    <div className="mt-5">{active ? <pre className="max-h-96 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(active, null, 2)}</pre> : <EmptyState title="Belum ada konfigurasi Analisa Ringkas" />}</div>
    <div className="mt-5 flex flex-wrap gap-3"><Button disabled={!draft || !validation?.valid} onClick={() => { if (draft) saveSummaryAnalysisConfig(draft); setDraft(null); onRefresh(); toast('Konfigurasi Analisa Ringkas disimpan.', 'teal'); }}>Simpan config</Button><Button variant="secondary" disabled={!active} onClick={() => downloadFile('summaryAnalysisConfig-export.json', JSON.stringify(active, null, 2))}>Export config</Button><Button variant="danger" onClick={() => { clearSummaryAnalysisConfig(); setDraft(null); setValidation(null); onRefresh(); toast('Konfigurasi Analisa Ringkas dihapus.', 'amber'); }}>Hapus config</Button></div>
  </Card>;
};
