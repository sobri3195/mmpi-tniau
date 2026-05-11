import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ScoreRow } from '../types';
import { generateChartData } from '../utils/scoring';

const colorFor = (t?: number | null) => typeof t === 'number' && t >= 75 ? '#be123c' : typeof t === 'number' && t >= 65 ? '#f59e0b' : '#0d9488';

export const ValidityChart = ({ scores }: { scores: ScoreRow[] }) => {
  const validityScores = scores.filter((score) => score.type === 'validity');
  const data = generateChartData(validityScores).filter((item) => item.tScore !== null);
  return (
    <div className="h-72 rounded-2xl border border-slate-100 p-3 sm:h-80 dark:border-slate-800">
      <h3 className="mb-2 font-bold">Validity Chart T-score</h3>
      {data.length ? <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="scale" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} domain={[30, 100]} />
          <Tooltip />
          <ReferenceLine y={65} stroke="#f59e0b" strokeDasharray="4 4" label="caution" />
          <ReferenceLine y={75} stroke="#be123c" strokeDasharray="4 4" label="review/retest" />
          <Bar dataKey="tScore" name="T-score validitas">
            {data.map((entry) => <Cell key={entry.scale} fill={colorFor(entry.tScore)} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer> : <p className="mt-10 text-sm text-slate-500">Skala validitas belum tersedia atau belum memiliki T-score.</p>}
    </div>
  );
};
