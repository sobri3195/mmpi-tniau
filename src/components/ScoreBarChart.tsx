import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ScoreRow } from '../types';
import { generateChartData } from '../utils/scoring';

export const ScoreBarChart = ({ scores }: { scores: ScoreRow[] }) => (
  <div className="h-72 rounded-2xl border border-slate-100 p-3 sm:h-80 dark:border-slate-800">
    <h3 className="mb-2 font-bold">Bar Chart Skor Mentah</h3>
    <ResponsiveContainer width="100%" height="90%">
      <BarChart data={generateChartData(scores)}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="scale" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Bar dataKey="rawScore" fill="#0d9488" name="Raw score" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);
