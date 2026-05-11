import type { SystemReadinessStatus } from '../../utils/systemReadiness';
import { Badge, Card } from '../ui';

const rows = [
  ['questionsReady', 'Cek Bank Soal', 'Bank Soal: Siap'],
  ['questionsReady', 'Cek Format Jawaban +/-', 'Format +/-: Siap'],
  ['scoringReady', 'Cek ScoringConfig', 'ScoringConfig: Siap Scoring'],
  ['normReady', 'Cek NormTable T-score', 'NormTable: Siap T-score'],
  ['rusdiInterpretationReady', 'Cek Interpretasi Rusdi Maslim', 'Interpretasi Rusdi Maslim: Siap'],
  ['hubertusInterpretationReady', 'Cek Interpretasi Hubertus', 'Interpretasi Hubertus: Siap'],
  ['normReady', 'Cek CodeTypeConfig', 'CodeTypeConfig: Opsional/Siap'],
  ['summaryAnalysisReady', 'Cek Analisa Ringkas TNI AU', 'Analisa Ringkas TNI AU: Siap'],
  ['rhReady', 'Cek RH Skrining', 'RH Skrining: Siap'],
  ['reportReady', 'Cek Template Laporan', 'Laporan: Siap'],
  ['specialistReady', 'Cek User Spesialis', 'Spesialis: Siap'],
  ['systemReadyForInterpretation', 'Finalisasi Sistem Siap Interpretasi', 'Status Sistem: SIAP INTERPRETASI'],
] as const;

export const ReadinessChecklist = ({ status }: { status: SystemReadinessStatus }) => (
  <Card>
    <h3 className="text-xl font-black">Checklist Wizard Siap Interpretasi</h3>
    <div className="mt-4 grid gap-3">
      {rows.map(([key, title, readyLabel], index) => {
        const ready = Boolean(status[key]);
        return <div key={`${index}-${title}`} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
          <div><p className="font-bold">{index + 1}. {title}</p><p className="text-sm text-slate-500">{ready ? readyLabel : 'Belum siap — lihat detail kekurangan dan panel import.'}</p></div>
          <Badge tone={ready ? 'teal' : 'amber'}>{ready ? 'Siap' : 'Perlu dilengkapi'}</Badge>
        </div>;
      })}
    </div>
  </Card>
);
