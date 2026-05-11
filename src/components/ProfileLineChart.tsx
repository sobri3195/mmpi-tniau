import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ScoreRow } from '../types';
import { generateChartData } from '../utils/scoring';

export const ProfileLineChart = ({ scores }: { scores: ScoreRow[] }) => (
  <div className="h-72 rounded-2xl border border-slate-100 p-3 sm:h-80 dark:border-slate-800">
    <h3 className="mb-2 font-bold">Line Chart Profil T-score</h3>
    <ResponsiveContainer width="100%" height="90%">
      <LineChart data={generateChartData(scores)}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="scale" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
        <YAxis allowDecimals={false} domain={[0, 'dataMax + 10']} />
        <Tooltip />
        <Legend />
        <ReferenceLine y={65} stroke="#e11d48" strokeDasharray="4 4" label="Elevated" />
        <ReferenceLine y={75} stroke="#7f1d1d" strokeDasharray="4 4" label="High" />
        <Line type="monotone" dataKey="plottedTScore" stroke="#2563eb" strokeWidth={3} name="T-score" connectNulls={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);
