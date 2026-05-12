import type { ReactNode } from 'react';
import { Button, Card } from '../ui';
import { ADMIN_SESSION_EXPIRED_MESSAGE, validateSession } from '../../utils/session';

export const AdminProtectedRoute = ({ children, onUnauthenticated }: { children: ReactNode; onUnauthenticated?: (message: string) => void }) => {
  const validation = validateSession();
  if (!validation.valid) {
    if (onUnauthenticated) window.setTimeout(() => onUnauthenticated(ADMIN_SESSION_EXPIRED_MESSAGE), 0);
    return <div className="mx-auto max-w-xl px-4 py-10"><Card><p className="font-semibold">{ADMIN_SESSION_EXPIRED_MESSAGE}</p><Button className="mt-4" onClick={() => { window.history.replaceState(null, '', '/admin/login'); window.dispatchEvent(new PopStateEvent('popstate')); }}>Ke Login Admin</Button></Card></div>;
  }
  return <>{children}</>;
};
