import type { AssessmentResult, ScoringConfig } from '../types';
import { generateSpecialistInterpretation } from '../utils/interpretation';

export const AppendixSection = ({ result, scoringConfig }: { result: AssessmentResult; scoringConfig?: ScoringConfig | null }) => {
  const report = generateSpecialistInterpretation(result, scoringConfig);
  return (
    <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
      <h3 className="font-black">Lampiran Keterangan Interpretasi</h3>
      <dl className="mt-4 grid gap-3 md:grid-cols-2">
        {report.appendix.map((item) => <div key={item.term} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><dt className="font-bold">{item.term}</dt><dd className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.description}</dd></div>)}
      </dl>
      <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:bg-amber-950 dark:text-amber-100"><p className="font-bold">Keterbatasan dan disclaimer</p><ul className="mt-2 list-disc space-y-1 pl-5">{report.limitations.map((item) => <li key={item}>{item}</li>)}</ul></div>
    </section>
  );
};
