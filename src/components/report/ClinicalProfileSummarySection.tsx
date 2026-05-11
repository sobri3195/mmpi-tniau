import type { SummaryAnalysisResult } from '../../types';

export const ClinicalProfileSummarySection = ({ analysis }: { analysis: SummaryAnalysisResult }) => {
  const incomplete = analysis.clinicalProfileSummary.warnings?.some((warning) => warning.includes('belum dapat dibuat'));
  return <section className="summary-print-section"><h3 className="text-lg font-black">III. PROFIL KLINIS</h3>{incomplete ? <p className="mt-3 text-sm leading-6">Profil klinis ringkas belum dapat dibuat karena konfigurasi analisa belum lengkap.</p> : analysis.clinicalProfileSummary.narratives.length ? <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{analysis.clinicalProfileSummary.narratives.map((text) => <li key={text}>{text}</li>)}</ul> : <p className="mt-3 text-sm leading-6">Tidak terdapat indikasi klinis menonjol berdasarkan konfigurasi yang tersedia.</p>}{analysis.clinicalProfileSummary.warnings?.filter((warning) => !warning.includes('belum dapat dibuat')).map((warning) => <p key={warning} className="mt-1 text-xs text-amber-700">⚠ {warning}</p>)}</section>;
};
