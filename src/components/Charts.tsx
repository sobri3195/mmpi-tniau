import type { ScoreRow } from '../types';
import { ProfileLineChart } from './ProfileLineChart';
import { RadarProfileChart } from './RadarProfileChart';
import { ScoreBarChart } from './ScoreBarChart';
import { ValidityChart } from './ValidityChart';

export const ScoreCharts = ({ scores }: { scores: ScoreRow[] }) => (
  <div className="grid gap-6 xl:grid-cols-2">
    <ScoreBarChart scores={scores} />
    <ValidityChart scores={scores} />
    <RadarProfileChart scores={scores} />
    <ProfileLineChart scores={scores} />
  </div>
);
