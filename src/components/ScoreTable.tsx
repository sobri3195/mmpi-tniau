import type { ScoreRow } from '../types';
import { Badge } from './ui';

export const ScoreTable = ({ scores }: { scores: ScoreRow[] }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[760px] text-left text-sm">
      <thead className="text-xs uppercase text-slate-500">
        <tr className="border-b border-slate-200 dark:border-slate-800">
          <th className="py-3">Kode</th><th>Nama skala</th><th>Raw</th><th>T-score</th><th>Kategori</th><th>Interpretasi</th>
        </tr>
      </thead>
      <tbody>
        {scores.map((score) => (
          <tr key={score.scaleId} className="border-b border-slate-100 dark:border-slate-800">
            <td className="py-3 font-mono font-bold">{score.scaleId}</td>
            <td>{score.scaleName}</td>
            <td className="font-bold">{score.rawScore}</td>
            <td>{score.tScore ?? <span className="text-slate-500">Belum dikonversi</span>}</td>
            <td><Badge tone={score.category === 'Tinggi' ? 'amber' : 'teal'}>{score.category}</Badge></td>
            <td><p>{score.interpretation}</p><p className="text-xs text-slate-500">{score.normStatus}</p></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
