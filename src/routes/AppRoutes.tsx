import type { ReactNode } from 'react';
import { Card } from '../components/ui';
import { validateSessionToken } from '../utils/tokenAccess';
import { validateParticipantAccess } from '../utils/tokenValidation';
import { getParticipantAccessRedirect, ParticipantProtectedRoute } from '../components/auth/ParticipantProtectedRoute';

export const ROUTES = {
  access: '/access',
  tokenDisabled: '/token-disabled',
  participant: '/participant',
  instruction: '/instruction',
  test: '/test',
  adminTokens: '/admin/tokens',
  rhSkrining: '/rh-skrining',
  rhReview: '/rh-review',
  adminRh: '/admin/rh',
  reportRh: '/report/:id/rh',
} as const;

export const requireTokenSession = () => validateSessionToken();

export const ProtectedTokenRoute = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => {
  const validation = validateParticipantAccess({ currentRoute: typeof window !== 'undefined' ? window.location.pathname : '' });
  if (!validation.allowed) return fallback || <Card><p className="font-semibold">{validation.message}</p></Card>;
  return <>{children}</>;
};

export { ParticipantProtectedRoute, getParticipantAccessRedirect };

export const requirePendingRHSession = () => {
  const validation = validateSessionToken();
  if (!validation.valid) return validation;
  const raw = typeof window !== 'undefined' ? localStorage.getItem('sppg_mmpi2_current_session') : null;
  const session = raw ? JSON.parse(raw) as { mmpiStatus?: string; rhStatus?: string } : null;
  const allowed = session?.mmpiStatus === 'mmpi_completed_pending_rh' || session?.rhStatus === 'in_progress';
  return allowed ? validation : { valid: false, message: 'RH Skrining hanya dapat dibuka setelah MMPI selesai dan sebelum hasil final ditampilkan.', token: validation.token };
};
