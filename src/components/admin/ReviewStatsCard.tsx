import type { ReviewStats } from '../../utils/systemReadiness';
import { Badge, Card } from '../ui';

export const ReviewStatsCard = ({ stats }: { stats: ReviewStats }) => (
  <Card>
    <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold uppercase tracking-wide text-teal-700">Status telaah</p><h3 className="text-xl font-black">{stats.message}</h3></div><Badge tone={stats.needReview ? 'amber' : 'teal'}>{stats.totalResults} hasil</Badge></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-5">
      <p><strong>Scoring:</strong><br />{stats.pendingScoring}</p><p><strong>RH:</strong><br />{stats.pendingRH}</p><p><strong>Perlu telaah:</strong><br />{stats.needReview}</p><p><strong>Ditelaah:</strong><br />{stats.reviewed}</p><p><strong>Final:</strong><br />{stats.finalized}</p>
    </div>
  </Card>
);
