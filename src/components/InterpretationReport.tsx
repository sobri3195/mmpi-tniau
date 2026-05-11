import type { AssessmentResult, ScoringConfig } from '../types';
import { generateSpecialistInterpretation } from '../utils/interpretation';
import { AppendixSection } from './AppendixSection';
import { ClinicalNarrative } from './ClinicalNarrative';
import { SpecialistInterpretation } from './SpecialistInterpretation';
import { Disclaimer, PrivacyNotice } from './ui';

export const InterpretationReport = ({ result, scoringConfig }: { result: AssessmentResult; scoringConfig?: ScoringConfig | null }) => {
  const report = generateSpecialistInterpretation(result, scoringConfig);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-teal-600 dark:text-teal-300">Executive Summary</p>
        <h2 className="text-xl font-black">{report.isDemo ? 'Interpretasi spesialis belum tersedia.' : 'Interpretasi Spesialis dan Rekomendasi Klinis'}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{report.executiveSummary}</p>
        <p className="mt-2 text-sm font-bold">Status telaah: {report.reviewStatus}</p>
      </div>
      {!report.isDemo && <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><h3 className="font-black">1. Telaah Validitas Profil</h3><p className="mt-2 text-sm leading-6">{report.validityNarrative}</p></section>}
      <ClinicalNarrative result={result} scoringConfig={scoringConfig} />
      <SpecialistInterpretation result={result} scoringConfig={scoringConfig} />
      <div className="grid gap-4 lg:grid-cols-2"><Disclaimer /><PrivacyNotice /></div>
      <AppendixSection result={result} scoringConfig={scoringConfig} />
      <div className="mt-12 text-left sm:text-right"><p className="font-bold">Tanda tangan pemeriksa</p><div className="mt-12 w-full border-t border-slate-400 pt-2 sm:ml-auto sm:w-64">Nama & SIP/izin praktik</div></div>
    </div>
  );
};
