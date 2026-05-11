import type { ScoreRow, ValidityStatus } from '../types';
import { generateSpecialistInterpretation, getScoreTone } from '../utils/interpretation';
import { Badge, Disclaimer, PrivacyNotice } from './ui';

const formatScore = (score: ScoreRow) => (score.tScore !== undefined ? `T=${score.tScore}` : `Raw=${score.rawScore}`);

export const InterpretationReport = ({ scores, validityStatus, clinicalSummary, recommendations }: { scores: ScoreRow[]; validityStatus?: ValidityStatus; clinicalSummary?: string; recommendations?: string[] }) => {
  const report = generateSpecialistInterpretation(scores);
  const finalClinicalSummary = validityStatus?.status === 'invalid' ? 'Status validitas invalid/perlu review. Kesimpulan klinis final tidak ditampilkan dan perlu review/retest oleh profesional.' : (clinicalSummary ?? report.clinicalSummary);
  const finalRecommendations = recommendations?.length ? recommendations : report.recommendations;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-teal-600 dark:text-teal-300">Kesimpulan akhir otomatis</p>
        <h2 className="text-xl font-black">Interpretasi Spesialis dan Rekomendasi Klinis</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Narasi ini menyusun hasil 567 butir/seluruh butir yang dijawab menjadi ringkasan klinis berbasis skala, kategori, dan norma yang diimpor admin.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
          <h3 className="font-black">1. Telaah Validitas Profil</h3>
          <p className="mt-2 text-sm leading-6">{report.validitySummary}</p>
        </section>
        <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
          <h3 className="font-black">2. Kesan Klinis Utama</h3>
          <p className="mt-2 text-sm leading-6">{finalClinicalSummary}</p>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        <h3 className="font-black">3. Skala Dominan untuk Dieksplorasi</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {report.dominantScales.map((score, index) => (
            <article key={score.scaleId} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">Prioritas {index + 1}</p>
                  <h4 className="font-black">{score.scaleId}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{score.scaleName}</p>
                </div>
                <Badge tone={getScoreTone(score)}>{score.category}</Badge>
              </div>
              <p className="mt-3 text-sm font-bold">{formatScore(score)}</p>
              <p className="mt-2 text-sm leading-6">{score.interpretation}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        <h3 className="font-black">4. Rekomendasi Tindak Lanjut</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
          {finalRecommendations.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Disclaimer />
        <PrivacyNotice />
      </div>

      <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        <h3 className="font-black">Lampiran Keterangan Interpretasi</h3>
        <dl className="mt-4 grid gap-3 md:grid-cols-2">
          {report.appendix.map((item) => (
            <div key={item.term} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
              <dt className="font-bold">{item.term}</dt>
              <dd className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.description}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:bg-amber-950 dark:text-amber-100">
          <p className="font-bold">Batasan laporan</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {report.limitations.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </section>

      <div className="mt-12 text-left sm:text-right">
        <p className="font-bold">Tanda tangan pemeriksa</p>
        <div className="mt-12 w-full border-t border-slate-400 pt-2 sm:ml-auto sm:w-64">Nama & SIP/izin praktik</div>
      </div>
    </div>
  );
};
