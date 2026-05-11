import type { ReactNode } from 'react';
import { Button, Card } from '../ui';
import { validateSession, logoutUser } from '../../utils/session';

export const AccessDenied = () => <div className="mx-auto max-w-xl px-4 py-10"><Card><p className="text-sm font-bold uppercase tracking-wide text-rose-600">Akses dibatasi</p><h1 className="mt-2 text-2xl font-black">Tidak memiliki akses ke halaman ini.</h1><div className="mt-6 flex flex-wrap gap-3"><Button onClick={() => { window.history.replaceState(null, '', '/admin/dashboard'); window.dispatchEvent(new PopStateEvent('popstate')); }}>Kembali ke Dashboard</Button><Button variant="danger" onClick={() => { logoutUser(); window.history.replaceState(null, '', '/admin/login'); window.dispatchEvent(new PopStateEvent('popstate')); }}>Logout</Button></div></Card></div>;

export const ProtectedRoute = ({ children, onUnauthenticated }: { children: ReactNode; onUnauthenticated?: () => void }) => {
  const validation = validateSession();
  if (!validation.valid) {
    if (onUnauthenticated) window.setTimeout(onUnauthenticated, 0);
    return <div className="mx-auto max-w-xl px-4 py-10"><Card><p className="font-semibold">{validation.message}</p><Button className="mt-4" onClick={() => { window.history.replaceState(null, '', '/admin/login'); window.dispatchEvent(new PopStateEvent('popstate')); }}>Ke Login Admin</Button></Card></div>;
  }
  return <>{children}</>;
};
