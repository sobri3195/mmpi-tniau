import type { ReactNode } from 'react';
import { Card } from '../components/ui';
import { validateSessionToken } from '../utils/tokenAccess';

export const ROUTES = {
  access: '/access',
  participant: '/participant',
  test: '/test',
  adminTokens: '/admin/tokens',
  rhSkrining: '/rh-skrining',
  rhReview: '/rh-review',
  adminRh: '/admin/rh',
  reportRh: '/report/:id/rh',
} as const;

export const requireTokenSession = () => validateSessionToken();

export const ProtectedTokenRoute = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => {
  const validation = validateSessionToken();
  if (!validation.valid) return fallback || <Card><p className="font-semibold">{validation.message}</p></Card>;
  return <>{children}</>;
};

export const requirePendingRHSession = () => {
  const validation = validateSessionToken();
  if (!validation.valid) return validation;
  const raw = typeof window !== 'undefined' ? localStorage.getItem('sppg_mmpi2_current_session') : null;
  const session = raw ? JSON.parse(raw) as { mmpiStatus?: string; rhStatus?: string } : null;
  const allowed = session?.mmpiStatus === 'mmpi_completed_pending_rh' || session?.rhStatus === 'in_progress';
  return allowed ? validation : { valid: false, message: 'RH Skrining hanya dapat dibuka setelah MMPI selesai dan sebelum hasil final ditampilkan.', token: validation.token };
};
