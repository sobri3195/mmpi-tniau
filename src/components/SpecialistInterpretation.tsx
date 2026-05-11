import type { AssessmentResult, ScoringConfig } from '../types';
import { generateSpecialistInterpretation } from '../utils/interpretation';
import { Badge } from './ui';

export const SpecialistInterpretation = ({ result, scoringConfig }: { result: AssessmentResult; scoringConfig?: ScoringConfig | null }) => {
  const report = generateSpecialistInterpretation(result, scoringConfig);
  if (report.isDemo) {
    return <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"><h2 className="text-xl font-black">Mode Demo: belum dapat dibuat interpretasi spesialis.</h2><p className="mt-2">Konfigurasi yang digunakan masih demo/placeholder. Laporan ini tidak valid untuk interpretasi klinis atau personel.</p></div>;
  }
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        <h3 className="font-black">4. Interpretasi Code Type</h3>
        <p className="mt-2 text-sm leading-6">{report.codeType.message}</p>
        {report.codeType.scales.length ? <div className="mt-3 flex flex-wrap gap-2">{report.codeType.scales.map((score) => <Badge key={score.scaleId} tone="amber">{score.code ?? score.scaleId}: T={score.tScore}</Badge>)}</div> : null}
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">{report.codeType.cautionNotes.map((note) => <li key={note}>{note}</li>)}</ul>
      </section>
      <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        <h3 className="font-black">5. Indikator Risiko yang Perlu Ditindaklanjuti</h3>
        {report.riskFlags.length ? <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">{report.riskFlags.map((flag) => <li key={flag}>{flag}</li>)}</ul> : <p className="mt-2 text-sm leading-6">Tidak ada red flag otomatis yang terdeteksi dari skala yang tersedia. Tetap lakukan telaah profesional sesuai konteks klinis dan tugas.</p>}
      </section>
      <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        <h3 className="font-black">6. Kesan Klinis Awal</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">{report.initialImpression.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
      <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        <h3 className="font-black">7. Rekomendasi Tindak Lanjut</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">{report.recommendations.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
    </div>
  );
};
