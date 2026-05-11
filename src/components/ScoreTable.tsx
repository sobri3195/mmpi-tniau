import type { ScoreRow } from '../types';
import { getScoreTone } from '../utils/interpretation';
import { Badge } from './ui';

export const ScoreTable = ({ scores }: { scores: ScoreRow[] }) => (
  <>
    <div className="space-y-3 md:hidden">
      {scores.map((score) => (
        <article key={score.scaleId} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-sm font-bold text-teal-700 dark:text-teal-300">{score.scaleId}</p>
              <h3 className="font-black">{score.scaleName}</h3>
            </div>
            <Badge tone={getScoreTone(score)}>{score.category}</Badge>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
              <dt className="text-xs uppercase text-slate-500">Raw</dt>
              <dd className="font-bold">{score.rawScore}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
              <dt className="text-xs uppercase text-slate-500">T-score</dt>
              <dd className="font-bold">{score.tScore ?? 'Belum dikonversi'}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm">{score.interpretation}</p>
          <p className="mt-1 text-xs text-slate-500">{score.normStatus}</p>
        </article>
      ))}
    </div>
    <div className="hidden overflow-x-auto md:block">
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
              <td><Badge tone={getScoreTone(score)}>{score.category}</Badge></td>
              <td><p>{score.interpretation}</p><p className="text-xs text-slate-500">{score.normStatus}</p></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
);
