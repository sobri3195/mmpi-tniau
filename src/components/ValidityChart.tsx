import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ScoreRow } from '../types';
import { generateChartData } from '../utils/scoring';

export const ValidityChart = ({ scores }: { scores: ScoreRow[] }) => {
  const validityScores = scores.filter((score) => score.type === 'validity');
  const data = generateChartData(validityScores.length ? validityScores : scores.slice(0, 5));
  return (
    <div className="h-72 rounded-2xl border border-slate-100 p-3 sm:h-80 dark:border-slate-800">
      <h3 className="mb-2 font-bold">Validity Chart</h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="scale" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <ReferenceLine y={65} stroke="#f59e0b" strokeDasharray="4 4" />
          <ReferenceLine y={75} stroke="#e11d48" strokeDasharray="4 4" />
          <Bar dataKey="plottedTScore" fill="#f59e0b" name="T-score validitas" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
