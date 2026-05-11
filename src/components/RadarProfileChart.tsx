import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { ScoreRow } from '../types';
import { buildDomainSummary } from '../utils/reportGenerator';

export const RadarProfileChart = ({ scores }: { scores: ScoreRow[] }) => {
  const data = buildDomainSummary(scores).map((item) => ({ domain: item.domain.replace(' dan ', ' & '), tScore: item.maxT || 50 }));
  return (
    <div className="h-72 rounded-2xl border border-slate-100 p-3 sm:h-80 dark:border-slate-800">
      <h3 className="mb-2 font-bold">Radar Chart Domain Kesehatan Jiwa</h3>
      <ResponsiveContainer width="100%" height="90%">
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="domain" tick={{ fontSize: 10 }} />
          <PolarRadiusAxis allowDecimals={false} domain={[30, 100]} />
          <Radar dataKey="tScore" stroke="#2563eb" fill="#2563eb" fillOpacity={0.25} name="Ringkasan domain (T tertinggi)" />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
