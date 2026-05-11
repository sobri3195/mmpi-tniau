import type { AssessmentResult, RHForm, SummaryAnalysisConfig } from '../../types';
import { Badge, Button, Card } from '../ui';
import { buildSummaryAnalysis, exportSummaryAnalysis, printSummaryAnalysis } from '../../utils/summaryAnalysis';
import { TestAttitudeSection } from './TestAttitudeSection';
import { MentalCapacityIndexSection } from './MentalCapacityIndexSection';
import { ClinicalProfileSummarySection } from './ClinicalProfileSummarySection';
import { BasicPersonalityIndexSection } from './BasicPersonalityIndexSection';
import { SummaryConclusionSection } from './SummaryConclusionSection';

export const SummaryAnalysisSection = ({ result, config, rhForm }: { result: AssessmentResult; config?: SummaryAnalysisConfig | null; rhForm?: RHForm | null }) => {
  const analysis = buildSummaryAnalysis(result, config ?? undefined);
  if (!analysis.available) return <Card><h2 className="text-xl font-black">Analisa Ringkas TNI AU</h2><p className="mt-3 text-sm text-amber-700">{analysis.message}</p></Card>;
  return <Card className="summary-analysis-report"><div className="summary-screen-header flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-wide text-teal-700">Analisa Ringkas TNI AU</p><h2 className="text-2xl font-black">LAPORAN HASIL TES MMPI-2</h2><p className="mt-1 text-sm text-slate-500">Ringkasan bantu untuk pemeriksa; bukan diagnosis final otomatis.</p></div><div className="flex flex-wrap gap-2"><Badge tone={analysis.isDemo ? 'amber' : 'teal'}>{analysis.isDemo ? 'Demo' : 'Admin imported'}</Badge></div></div>
    {analysis.isDemo && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">Analisa Ringkas masih demo dan tidak valid untuk laporan final.</div>}
    <div className="summary-print-header hidden"><h1>LAPORAN HASIL TES MMPI-2</h1><p>TNI AU / SPPG</p><table><tbody><tr><td>Nama</td><td>{result.identity.name}</td></tr><tr><td>Umur</td><td>{result.identity.age}</td></tr><tr><td>Pendidikan</td><td>{result.identity.education}</td></tr><tr><td>Pekerjaan</td><td>{result.identity.occupation}</td></tr></tbody></table></div>
    <div className="mt-5 space-y-6"><TestAttitudeSection analysis={analysis} config={config} /><MentalCapacityIndexSection analysis={analysis} /><ClinicalProfileSummarySection analysis={analysis} /><BasicPersonalityIndexSection analysis={analysis} /><SummaryConclusionSection analysis={analysis} /></div>
    {analysis.validationWarnings?.length ? <details className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-800"><summary className="cursor-pointer font-bold">Warning konfigurasi</summary><ul className="mt-2 list-disc pl-5">{analysis.validationWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></details> : null}
    <div className="summary-print-footer hidden"><p>Tanggal laporan: {new Date().toLocaleDateString('id-ID')}</p><p>Tempat laporan: ____________________</p><div className="signature-space"><p>Tanda tangan pemeriksa</p><p>______________________________</p><p>Nama dan gelar pemeriksa</p></div></div>
    <div className="no-print mt-6 flex flex-wrap gap-3"><Button onClick={printSummaryAnalysis}>Cetak Analisa Ringkas</Button><Button variant="secondary" onClick={() => exportSummaryAnalysis(result, 'json', rhForm)}>Export Analisa Ringkas JSON</Button><Button variant="ghost" onClick={() => exportSummaryAnalysis(result, 'csv', rhForm)}>Export Analisa Ringkas CSV</Button></div>
  </Card>;
};
