import { ADMIN_STORAGE_KEYS, readAdminJson, removeAdminKey, writeAdminJson } from './adminStorage';
import type { AdminRole } from './roles';
import type { AdminUser } from './userStorage';
import { getUsers, isUserLocked, recordFailedLogin, touchUserLastLogin, verifyUserPassword } from './userStorage';
import { writeAuditLog } from './auditLog';

export interface AuthSession {
  sessionId: string;
  userId: string;
  username: string;
  displayName: string;
  role: AdminRole;
  loginAt: string;
  expiresAt: string;
}

const SESSION_HOURS = 8;
export const ADMIN_SESSION_EXPIRED_MESSAGE = 'Sesi admin berakhir. Silakan login kembali.';

export const loadAuthSession = () => readAdminJson<AuthSession | null>(ADMIN_STORAGE_KEYS.authSession, null);
export const saveAuthSession = (session: AuthSession) => writeAdminJson(ADMIN_STORAGE_KEYS.authSession, session);
export const clearAuthSession = () => removeAdminKey(ADMIN_STORAGE_KEYS.authSession);

export const validateSession = () => {
  const session = loadAuthSession();
  if (!session) return { valid: false, message: ADMIN_SESSION_EXPIRED_MESSAGE };
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    writeAuditLog({ userId: session.userId, username: session.username, role: session.role, action: 'session_expired', targetType: 'auth_session', targetId: session.sessionId, description: 'Sesi admin kedaluwarsa.', severity: 'warning' });
    clearAuthSession();
    return { valid: false, message: ADMIN_SESSION_EXPIRED_MESSAGE };
  }
  const user = getUsers().find((item) => item.userId === session.userId);
  if (!user || !user.isActive) {
    clearAuthSession();
    return { valid: false, message: ADMIN_SESSION_EXPIRED_MESSAGE };
  }
  return { valid: true, session, user, message: 'Sesi valid.' };
};

export const getCurrentUser = (): AdminUser | null => {
  const validation = validateSession();
  return validation.valid ? (validation.user ?? null) : null;
};

export const getSessionRemainingMs = () => {
  const session = loadAuthSession();
  return session ? Math.max(0, new Date(session.expiresAt).getTime() - Date.now()) : 0;
};

export const loginUser = async (username: string, password: string) => {
  const normalized = username.trim().toLowerCase();
  const user = getUsers().find((item) => item.username === normalized);
  if (!user) {
    writeAuditLog({ action: 'login_failed', targetType: 'user', targetId: normalized, description: 'Percobaan login gagal.', severity: 'warning', username: normalized, role: '' });
    throw new Error('Username atau password salah.');
  }
  if (!user.isActive) throw new Error('Akun dinonaktifkan. Hubungi Superadmin.');
  if (isUserLocked(user)) throw new Error('Akun terkunci sementara karena terlalu banyak percobaan login.');
  const verified = await verifyUserPassword(user, password);
  if (!verified) {
    const locked = recordFailedLogin(user.userId);
    writeAuditLog({ userId: user.userId, username: user.username, role: user.role, action: locked ? 'login_locked' : 'login_failed', targetType: 'user', targetId: user.userId, description: locked ? 'Akun terkunci karena terlalu banyak percobaan login.' : 'Percobaan login gagal.', severity: 'warning' });
    throw new Error('Username atau password salah.');
  }
  const loginAt = new Date();
  const session: AuthSession = {
    sessionId: crypto.randomUUID(),
    userId: user.userId,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    loginAt: loginAt.toISOString(),
    expiresAt: new Date(loginAt.getTime() + SESSION_HOURS * 60 * 60 * 1000).toISOString(),
  };
  saveAuthSession(session);
  touchUserLastLogin(user.userId);
  writeAuditLog({ userId: user.userId, username: user.username, role: user.role, action: 'login_success', targetType: 'auth_session', targetId: session.sessionId, description: 'Admin login berhasil.', severity: 'info' });
  return session;
};

export const logoutUser = (reason = 'Admin logout.') => {
  const session = loadAuthSession();
  if (session) writeAuditLog({ userId: session.userId, username: session.username, role: session.role, action: 'logout', targetType: 'auth_session', targetId: session.sessionId, description: reason, severity: 'info' });
  clearAuthSession();
};
