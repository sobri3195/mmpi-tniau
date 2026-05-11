export type AdminRole = 'superadmin' | 'tester' | 'specialist';

export const ROLE_LABELS: Record<AdminRole, string> = {
  superadmin: 'Superadmin',
  tester: 'Tester / Operator Tes',
  specialist: 'Spesialis',
};

export const ROLE_BADGE_LABELS: Record<AdminRole, string> = {
  superadmin: 'Superadmin',
  tester: 'Tester',
  specialist: 'Spesialis',
};

export const hasRole = (role: AdminRole | undefined, allowedRoles: AdminRole[]) => Boolean(role && allowedRoles.includes(role));
