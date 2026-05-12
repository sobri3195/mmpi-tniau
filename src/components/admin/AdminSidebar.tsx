import { hasPermission } from '../../utils/permissions';
import type { AdminUser } from '../../utils/userStorage';
import { adminNavItems } from './adminNavigation';

export const AdminSidebar = ({ user, currentPath, navigate }: { user: AdminUser; currentPath: string; navigate: (path: string) => void }) => {
  const items = adminNavItems.filter((item) => (!item.permission || hasPermission(user, item.permission)) && (!item.roles || item.roles.includes(user.role)));
  return <aside className="h-fit rounded-3xl border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/80"><nav className="grid gap-2">{items.map((item) => <button key={item.path} type="button" onClick={() => navigate(item.path)} className={`rounded-2xl px-4 py-3 text-left text-sm font-bold transition ${currentPath === item.path ? 'bg-teal-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>{item.label}</button>)}</nav></aside>;
};
