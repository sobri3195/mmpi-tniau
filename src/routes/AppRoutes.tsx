import type { ReactNode } from 'react';
import { Card } from '../components/ui';
import { validateSessionToken } from '../utils/tokenAccess';

export const ROUTES = {
  access: '/access',
  participant: '/participant',
  test: '/test',
  adminTokens: '/admin/tokens',
} as const;

export const requireTokenSession = () => validateSessionToken();

export const ProtectedTokenRoute = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => {
  const validation = validateSessionToken();
  if (!validation.valid) return fallback || <Card><p className="font-semibold">{validation.message}</p></Card>;
  return <>{children}</>;
};
