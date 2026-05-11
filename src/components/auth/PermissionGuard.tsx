import type { ReactNode } from 'react';
import type { PermissionKey } from '../../utils/permissions';
import { hasPermission } from '../../utils/permissions';
import { getCurrentUser } from '../../utils/session';
import { AccessDenied } from './ProtectedRoute';

export const PermissionGuard = ({ permission, children }: { permission: PermissionKey; children: ReactNode }) => {
  const user = getCurrentUser();
  if (!hasPermission(user, permission)) return <AccessDenied />;
  return <>{children}</>;
};
