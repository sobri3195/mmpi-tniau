import type { ReactNode } from 'react';
import { Card } from '../ui';
import { validateParticipantAccess } from '../../utils/tokenValidation';

export const ProtectedTokenRoute = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => {
  const validation = validateParticipantAccess({ currentRoute: typeof window !== 'undefined' ? window.location.pathname : '' });
  if (!validation.allowed) return fallback || <Card><p className="font-semibold">{validation.message}</p></Card>;
  return <>{children}</>;
};
