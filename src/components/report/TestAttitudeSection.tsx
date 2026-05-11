import type { SummaryAnalysisConfig, SummaryAnalysisResult } from '../../types';

export const TestAttitudeSection = ({ analysis, config }: { analysis: SummaryAnalysisResult; config?: SummaryAnalysisConfig | null }) => {
  const rules = config?.validityAttitude?.scoreRules ?? [
    { score: 0, label: 'Tidak valid', description: 'Tidak valid dan tidak dapat diinterpretasi sama sekali' },
    { score: 1, label: 'Masih valid dengan modifikasi', description: 'Masih valid dan dapat diinterpretasi dengan modifikasi' },
    { score: 2, label: 'Valid', description: 'Valid dan dapat diinterpretasi sepenuhnya' },
  ];
  return <section className="summary-print-section"><h3 className="text-lg font-black">I. SIKAP TERHADAP TES</h3><p className="mt-3 text-sm leading-6">{analysis.testAttitude.narrative}</p><p className="mt-2 text-sm font-bold">Skor validitas: {analysis.testAttitude.score ?? 'Belum tersedia'} — {analysis.testAttitude.label}</p>{analysis.testAttitude.warnings?.map((warning) => <p key={warning} className="mt-1 text-xs text-amber-700">⚠ {warning}</p>)}<div className="mt-4 overflow-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="py-2">Skor</th><th>Label</th><th>Makna</th></tr></thead><tbody>{rules.map((rule) => <tr key={rule.score} className="border-b border-slate-100 dark:border-slate-800"><td className="py-2 font-bold">{rule.score}</td><td>{rule.label}</td><td>{rule.description}</td></tr>)}</tbody></table></div></section>;
};
