import type { ReactNode } from 'react';
import type { AdminRole } from '../../utils/roles';
import { hasRole } from '../../utils/roles';
import { getCurrentUser } from '../../utils/session';
import { AccessDenied } from './ProtectedRoute';

export const RoleGuard = ({ roles, children }: { roles: AdminRole[]; children: ReactNode }) => {
  const user = getCurrentUser();
  if (!hasRole(user?.role, roles)) return <AccessDenied />;
  return <>{children}</>;
};
