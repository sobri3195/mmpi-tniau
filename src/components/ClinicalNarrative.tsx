import type { AssessmentResult, ScoringConfig } from '../types';
import { generateSpecialistInterpretation } from '../utils/interpretation';
import { Badge } from './ui';

export const ClinicalNarrative = ({ result, scoringConfig }: { result: AssessmentResult; scoringConfig?: ScoringConfig | null }) => {
  const report = generateSpecialistInterpretation(result, scoringConfig);
  if (report.isDemo) return null;
  return (
    <div className="space-y-5">
      <section>
        <h3 className="font-black">2. Profil Klinis Utama</h3>
        {report.clinicalNarratives.length ? <div className="mt-3 grid gap-3 md:grid-cols-2">
          {report.clinicalNarratives.map(({ score, meaning, explore, caution }) => (
            <article key={score.scaleId} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
              <div className="flex items-start justify-between gap-2"><div><p className="font-mono text-sm font-bold text-teal-700 dark:text-teal-300">{score.code ?? score.scaleId}</p><h4 className="font-black">{score.scaleName}</h4></div><Badge tone="rose">T={score.tScore}</Badge></div>
              <p className="mt-2 text-sm"><strong>Kategori:</strong> {score.category}</p>
              <p className="mt-2 text-sm leading-6"><strong>Makna klinis umum:</strong> {meaning}</p>
              <p className="mt-2 text-sm leading-6"><strong>Area eksplorasi:</strong> {explore}</p>
              <p className="mt-2 text-sm leading-6"><strong>Catatan kehati-hatian:</strong> {caution}</p>
            </article>
          ))}
        </div> : <p className="mt-2 text-sm leading-6">Tidak terdapat elevasi klinis bermakna pada skala utama berdasarkan norma yang tersedia. Tetap perlu mempertimbangkan konteks tugas, wawancara, observasi, dan riwayat psikososial.</p>}
      </section>
      <section>
        <h3 className="font-black">3. Analisa Domain Kesehatan Jiwa</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {report.domainSummaries.map((item) => <article key={item.domain} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><h4 className="font-bold">{item.domain}</h4><p className="mt-2 text-sm leading-6">{item.narrative}</p></article>)}
        </div>
        <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 dark:bg-slate-800">Dalam konteks kesehatan jiwa TNI AU, area yang relevan untuk ditelaah lebih lanjut meliputi stabilitas emosi, toleransi stres, kontrol impuls, kerja sama tim, kepatuhan terhadap aturan, dan fungsi interpersonal. Keputusan akhir mengenai kelayakan atau penempatan harus tetap berada pada otoritas profesional/institusional yang berwenang.</p>
      </section>
    </div>
  );
};
