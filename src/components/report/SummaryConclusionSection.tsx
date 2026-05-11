import type { SummaryAnalysisResult } from '../../types';

export const SummaryConclusionSection = ({ analysis }: { analysis: SummaryAnalysisResult }) => <section className="summary-print-section"><h3 className="text-lg font-black">V. KESIMPULAN DAN SARAN</h3><p className="mt-3 text-sm leading-6">{analysis.conclusionAndSuggestion.conclusion}</p><p className="mt-2 text-sm leading-6 font-semibold">{analysis.conclusionAndSuggestion.suggestion}</p></section>;
