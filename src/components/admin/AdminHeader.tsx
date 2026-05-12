import { Badge, Button } from '../ui';
import { RoleBadge } from './RoleBadge';
import type { AdminUser } from '../../utils/userStorage';
import { getSessionRemainingMs, logoutUser } from '../../utils/session';

const formatRemaining = (ms: number) => {
  const totalMinutes = Math.ceil(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}j ${minutes}m`;
};

export const AdminHeader = ({ user, onRefresh, onLogout }: { user: AdminUser; onRefresh: () => void; onLogout: () => void }) => (
  <div className="mb-6 space-y-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-teal-700">Admin Dashboard</p>
        <h1 className="text-2xl font-black sm:text-3xl">Asesmen MMPI TNI AU / SPPG</h1>
        <p className="text-slate-500">Akses terkelola untuk Superadmin, Tester, dan Spesialis.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="teal">Admin Panel</Badge>
        <RoleBadge role={user.role} />
        <span className="text-sm font-bold">{user.displayName}</span>
        <span className="text-xs font-semibold text-slate-500">Sesi tersisa {formatRemaining(getSessionRemainingMs())}</span>
        <Button variant="ghost" onClick={onRefresh}>Refresh</Button>
        <Button variant="danger" onClick={() => { logoutUser(); onLogout(); }}>Logout</Button>
      </div>
    </div>
  </div>
);
