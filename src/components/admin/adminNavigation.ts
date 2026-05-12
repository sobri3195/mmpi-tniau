import type { AdminRole } from '../../utils/roles';
import type { PermissionKey } from '../../utils/permissions';

export interface AdminNavItem {
  path: string;
  label: string;
  permission?: PermissionKey;
  roles?: AdminRole[];
}

export const adminNavItems: AdminNavItem[] = [
  { path: '/admin/dashboard', label: 'Dashboard' },
  { path: '/admin/users', label: 'User Management', permission: 'users.read' },
  { path: '/admin/tokens', label: 'Token Management', permission: 'tokens.create' },
  { path: '/admin/tokens-advanced', label: 'Token Lanjutan', permission: 'tokens.create' },
  { path: '/admin/config', label: 'Config Management', permission: 'config.importQuestions' },
  { path: '/admin/config-versions', label: 'Config Versions', permission: 'config.importQuestions' },
  { path: '/admin/interpretations', label: 'Konfigurasi Interpretasi', permission: 'config.importQuestions' },
  { path: '/admin/summary-analysis', label: 'Konfigurasi Analisa Ringkas', permission: 'config.importQuestions' },
  { path: '/admin/readiness-wizard', label: 'Wizard Siap Interpretasi', permission: 'config.importQuestions' },
  { path: '/admin/session-monitoring', label: 'Monitoring Sesi', permission: 'results.readAdministrative' },
  { path: '/admin/analytics', label: 'Statistik Operasional', permission: 'results.readAdministrative' },
  { path: '/admin/anomalies', label: 'Anomali Operasional', permission: 'results.readAdministrative' },
  { path: '/admin/results', label: 'Results Management', permission: 'results.readAdministrative' },
  { path: '/admin/rh', label: 'RH Skrining', permission: 'results.readAdministrative' },
  { path: '/admin/review', label: 'Telaah spesialis', permission: 'review.create' },
  { path: '/admin/operator-verification', label: 'Verifikasi Operator', permission: 'results.readAdministrative' },
  { path: '/admin/specialist-review', label: 'Review Bertingkat', permission: 'review.create' },
  { path: '/admin/final-approval', label: 'Final Approval', permission: 'review.create' },
  { path: '/admin/report-template', label: 'Template Laporan', permission: 'config.importQuestions' },
  { path: '/admin/archive', label: 'Ekspor Arsip', permission: 'backup.export' },
  { path: '/admin/settings', label: 'Report Settings', roles: ['superadmin'] },
  { path: '/admin/backup', label: 'Backup & Restore', permission: 'backup.export' },
  { path: '/admin/audit', label: 'Audit Logs', permission: 'audit.read' },
];
