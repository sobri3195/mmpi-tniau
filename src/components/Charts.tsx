import { Bar, BarChart, CartesianGrid, Legend, Radar, RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from 'recharts';
import type { ScoreRow } from '../types';
import { generateChartData } from '../utils/scoring';

export const ScoreCharts = ({ scores }: { scores: ScoreRow[] }) => {
  const data = generateChartData(scores);
  const hasTScore = scores.some((score) => score.tScore !== undefined);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="h-72 rounded-2xl border border-slate-100 p-3 sm:h-80 dark:border-slate-800">
        <h3 className="mb-2 font-bold">Bar Chart Skor Mentah</h3>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="scale" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="rawScore" fill="#0d9488" name="Raw score" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="h-72 rounded-2xl border border-slate-100 p-3 sm:h-80 dark:border-slate-800">
        <h3 className="mb-2 font-bold">Grafik Profil T-score</h3>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="scale" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} domain={[0, 'dataMax + 10']} />
            <Tooltip />
            <Legend />
            <ReferenceLine y={65} stroke="#e11d48" strokeDasharray="4 4" label="Elevasi" />
            <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="4 4" label="Waspada" />
            <Bar dataKey="tScore" fill="#2563eb" name={hasTScore ? 'T-score' : 'T-score belum tersedia'} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="h-72 rounded-2xl border border-slate-100 p-3 sm:h-80 xl:col-span-2 dark:border-slate-800">
        <h3 className="mb-2 font-bold">Radar Profil Skala</h3>
        <ResponsiveContainer width="100%" height="90%">
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="scale" tick={{ fontSize: 11 }} />
            <PolarRadiusAxis allowDecimals={false} />
            <Radar dataKey={hasTScore ? 'tScore' : 'rawScore'} stroke="#2563eb" fill="#2563eb" fillOpacity={0.25} name={hasTScore ? 'T-score' : 'Raw score'} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
