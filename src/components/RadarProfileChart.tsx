import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { ScoreRow } from '../types';
import { generateChartData } from '../utils/scoring';

export const RadarProfileChart = ({ scores }: { scores: ScoreRow[] }) => {
  const hasTScore = scores.some((score) => score.tScore !== undefined);
  return (
    <div className="h-72 rounded-2xl border border-slate-100 p-3 sm:h-80 dark:border-slate-800">
      <h3 className="mb-2 font-bold">Radar Chart Profil</h3>
      <ResponsiveContainer width="100%" height="90%">
        <RadarChart data={generateChartData(scores)}>
          <PolarGrid />
          <PolarAngleAxis dataKey="scale" tick={{ fontSize: 11 }} />
          <PolarRadiusAxis allowDecimals={false} />
          <Radar dataKey={hasTScore ? 'plottedTScore' : 'rawScore'} stroke="#2563eb" fill="#2563eb" fillOpacity={0.25} name={hasTScore ? 'T-score' : 'Raw score'} />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
