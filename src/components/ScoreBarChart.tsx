import { Bar, BarChart, CartesianGrid, Cell, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ScoreRow } from '../types';
import { generateChartData } from '../utils/scoring';

const colorFor = (t?: number | null) => {
  if (typeof t !== 'number') return '#94a3b8';
  if (t >= 75) return '#be123c';
  if (t >= 65) return '#f97316';
  if (t >= 60) return '#f59e0b';
  return '#0d9488';
};

export const ScoreBarChart = ({ scores }: { scores: ScoreRow[] }) => {
  const data = generateChartData(scores).filter((item) => item.tScore !== null);
  return (
    <div className="h-72 rounded-2xl border border-slate-100 p-3 sm:h-80 dark:border-slate-800">
      <h3 className="mb-2 font-bold">Bar Chart T-score</h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="scale" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} domain={[30, 100]} />
          <Tooltip />
          <Legend />
          <ReferenceLine y={50} stroke="#64748b" strokeDasharray="3 3" label="50" />
          <ReferenceLine y={65} stroke="#f97316" strokeDasharray="4 4" label="65" />
          <ReferenceLine y={75} stroke="#be123c" strokeDasharray="4 4" label="75" />
          <Bar dataKey="tScore" name="T-score">
            {data.map((entry) => <Cell key={entry.scale} fill={colorFor(entry.tScore)} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
