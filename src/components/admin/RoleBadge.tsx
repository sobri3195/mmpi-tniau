import { Badge } from '../ui';
import type { AdminRole } from '../../utils/roles';
import { ROLE_BADGE_LABELS } from '../../utils/roles';

export const RoleBadge = ({ role }: { role: AdminRole }) => {
  const tone = role === 'superadmin' ? 'rose' : role === 'specialist' ? 'teal' : 'amber';
  return <Badge tone={tone}>{ROLE_BADGE_LABELS[role]}</Badge>;
};
