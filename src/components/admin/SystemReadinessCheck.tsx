import type { Question, ScoringConfig } from '../../types';
import type { AdminReportSettings } from '../../utils/adminStorage';
import { getSystemReadinessStatus } from '../../utils/systemReadiness';
import { Badge, Card } from '../ui';

const statusRows = [
  ['Bank Soal', 'questionsReady', 'Siap'],
  ['ScoringConfig', 'scoringReady', 'Siap Scoring'],
  ['NormTable', 'normReady', 'Siap T-score'],
  ['Interpretasi Rusdi Maslim', 'rusdiInterpretationReady', 'Siap'],
  ['Interpretasi Hubertus', 'hubertusInterpretationReady', 'Siap'],
  ['Analisa Ringkas TNI AU', 'summaryAnalysisReady', 'Siap'],
  ['RH Skrining', 'rhReady', 'Siap'],
  ['Laporan', 'reportReady', 'Siap'],
  ['Spesialis', 'specialistReady', 'Siap'],
] as const;

export const SystemReadinessCheck = (_props: { questions: Question[]; scoringConfig: ScoringConfig | null; normTable: unknown; interpretationConfig: unknown; codeTypeConfig: unknown; settings: AdminReportSettings }) => {
  const status = getSystemReadinessStatus();
  return <Card>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div><h2 className="text-xl font-black">Status Kesiapan Sistem</h2><p className="mt-1 text-sm text-slate-500">Dashboard menampilkan status berdasarkan validasi config, bukan demo/placeholder.</p></div>
      <Badge tone={status.systemReadyForInterpretation ? 'teal' : 'amber'}>Status Sistem: {status.overallStatus === 'SIAP_INTERPRETASI' ? 'SIAP INTERPRETASI' : 'BELUM SIAP'}</Badge>
    </div>
    <div className="mt-5 grid gap-3 md:grid-cols-2">
      {statusRows.map(([label, key, readyText]) => {
        const ready = Boolean(status[key]);
        const validationKey = key === 'questionsReady' ? 'questions' : key === 'scoringReady' ? 'scoring' : key === 'normReady' ? 'norm' : key === 'rusdiInterpretationReady' ? 'rusdiInterpretation' : key === 'hubertusInterpretationReady' ? 'hubertusInterpretation' : key === 'summaryAnalysisReady' ? 'summaryAnalysis' : key === 'rhReady' ? 'rh' : key === 'reportReady' ? 'report' : 'specialist';
        const validation = status.validations[validationKey];
        return <div key={label} className={`rounded-2xl border p-4 ${ready ? 'border-teal-200 bg-teal-50 dark:border-teal-800 dark:bg-teal-950' : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950'}`}>
          <div className="flex items-center justify-between gap-3"><p className="font-black">{label}: {ready ? readyText : 'Perlu dilengkapi'}</p><Badge tone={ready ? 'teal' : 'amber'}>{ready ? 'Siap' : 'Cek detail'}</Badge></div>
          {!ready && <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{[...(validation?.errors ?? []), ...(validation?.missing ?? [])].slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul>}
        </div>;
      })}
    </div>
  </Card>;
};
