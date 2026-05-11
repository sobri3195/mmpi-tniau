import type { AdminUser } from './userStorage';
import type { AdminRole } from './roles';

export type PermissionKey =
  | 'users.create' | 'users.read' | 'users.update' | 'users.disable'
  | 'config.importQuestions' | 'config.importScoring' | 'config.importNorms' | 'config.importInterpretation' | 'config.importCodeType'
  | 'tokens.create' | 'tokens.bulkCreate' | 'tokens.print' | 'tokens.revoke' | 'tokens.reset'
  | 'results.readAdministrative' | 'results.readClinical' | 'results.delete' | 'results.export' | 'results.print'
  | 'review.create' | 'review.update' | 'review.finalize' | 'review.lock'
  | 'backup.export' | 'backup.restore' | 'system.reset' | 'audit.read';

export const permissions: Record<PermissionKey, AdminRole[]> = {
  'users.create': ['superadmin'],
  'users.read': ['superadmin'],
  'users.update': ['superadmin'],
  'users.disable': ['superadmin'],

  'config.importQuestions': ['superadmin'],
  'config.importScoring': ['superadmin'],
  'config.importNorms': ['superadmin'],
  'config.importInterpretation': ['superadmin'],
  'config.importCodeType': ['superadmin'],

  'tokens.create': ['superadmin', 'tester'],
  'tokens.bulkCreate': ['superadmin', 'tester'],
  'tokens.print': ['superadmin', 'tester'],
  'tokens.revoke': ['superadmin'],
  'tokens.reset': ['superadmin'],

  'results.readAdministrative': ['superadmin', 'tester', 'specialist'],
  'results.readClinical': ['superadmin', 'specialist'],
  'results.delete': ['superadmin'],
  'results.export': ['superadmin', 'specialist'],
  'results.print': ['superadmin', 'specialist'],

  'review.create': ['specialist', 'superadmin'],
  'review.update': ['specialist', 'superadmin'],
  'review.finalize': ['specialist', 'superadmin'],
  'review.lock': ['specialist', 'superadmin'],

  'backup.export': ['superadmin'],
  'backup.restore': ['superadmin'],
  'system.reset': ['superadmin'],
  'audit.read': ['superadmin'],
};

export const hasPermission = (user: Pick<AdminUser, 'role' | 'permissions' | 'isActive'> | null | undefined, permission: PermissionKey) => {
  if (!user?.isActive) return false;
  return permissions[permission].includes(user.role) || user.permissions.includes(permission);
};

export const requirePermission = (user: Pick<AdminUser, 'role' | 'permissions' | 'isActive'> | null | undefined, permission: PermissionKey) => {
  if (!hasPermission(user, permission)) throw new Error('Tidak memiliki akses ke halaman ini.');
  return true;
};
