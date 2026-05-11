import type { AdminRole } from '../../utils/roles';
import { hasPermission, type PermissionKey } from '../../utils/permissions';
import type { AdminUser } from '../../utils/userStorage';

export interface AdminNavItem { path: string; label: string; permission?: PermissionKey; roles?: AdminRole[]; }
export const adminNavItems: AdminNavItem[] = [
  { path: '/admin/dashboard', label: 'Dashboard' },
  { path: '/admin/users', label: 'User Management', permission: 'users.read' },
  { path: '/admin/tokens', label: 'Token Management', permission: 'tokens.create' },
  { path: '/admin/config', label: 'Config Management', permission: 'config.importQuestions' },
  { path: '/admin/interpretations', label: 'Konfigurasi Interpretasi', permission: 'config.importQuestions' },
  { path: '/admin/summary-analysis', label: 'Konfigurasi Analisa Ringkas', permission: 'config.importQuestions' },
  { path: '/admin/readiness-wizard', label: 'Wizard Siap Interpretasi', permission: 'config.importQuestions' },
  { path: '/admin/results', label: 'Results Management', permission: 'results.readAdministrative' },
  { path: '/admin/rh', label: 'RH Skrining', permission: 'results.readAdministrative' },
  { path: '/admin/review', label: 'Telaah spesialis', permission: 'review.create' },
  { path: '/admin/settings', label: 'Report Settings', roles: ['superadmin'] },
  { path: '/admin/backup', label: 'Backup & Restore', permission: 'backup.export' },
  { path: '/admin/audit', label: 'Audit Logs', permission: 'audit.read' },
];

export const AdminSidebar = ({ user, currentPath, navigate }: { user: AdminUser; currentPath: string; navigate: (path: string) => void }) => {
  const items = adminNavItems.filter((item) => (!item.permission || hasPermission(user, item.permission)) && (!item.roles || item.roles.includes(user.role)));
  return <aside className="h-fit rounded-3xl border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/80"><nav className="grid gap-2">{items.map((item) => <button key={item.path} type="button" onClick={() => navigate(item.path)} className={`rounded-2xl px-4 py-3 text-left text-sm font-bold transition ${currentPath === item.path ? 'bg-teal-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>{item.label}</button>)}</nav></aside>;
};
