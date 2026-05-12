import { validateSessionToken } from '../utils/tokenAccess';

export const ROUTES = {
  access: '/access',
  tokenDisabled: '/token-disabled',
  participant: '/participant',
  instruction: '/instruction',
  test: '/test',
  adminSetup: '/admin/setup',
  adminLogin: '/admin/login',
  adminDashboard: '/admin/dashboard',
  adminUsers: '/admin/users',
  adminTokens: '/admin/tokens',
  adminConfig: '/admin/config',
  adminResults: '/admin/results',
  adminReview: '/admin/review',
  adminSettings: '/admin/settings',
  adminBackup: '/admin/backup',
  adminAudit: '/admin/audit',
  adminAnalytics: '/admin/analytics',
  rhSkrining: '/rh-skrining',
  rhReview: '/rh-review',
  adminRh: '/admin/rh',
  reportRh: '/report/:id/rh',
} as const;

export const requireTokenSession = () => validateSessionToken();

export const requirePendingRHSession = () => {
  const validation = validateSessionToken();
  if (!validation.valid) return validation;
  const raw = typeof window !== 'undefined' ? localStorage.getItem('sppg_mmpi2_current_session') : null;
  const session = raw ? JSON.parse(raw) as { mmpiStatus?: string; rhStatus?: string } : null;
  const allowed = session?.mmpiStatus === 'mmpi_completed_pending_rh' || session?.rhStatus === 'in_progress';
  return allowed ? validation : { valid: false, message: 'RH Skrining hanya dapat dibuka setelah MMPI selesai dan sebelum hasil final ditampilkan.', token: validation.token };
};
