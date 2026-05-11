import { ADMIN_STORAGE_KEYS, readAdminJson, removeAdminKey, writeAdminJson } from './adminStorage';
import type { AdminRole } from './roles';
import type { AdminUser } from './userStorage';
import { getUsers, touchUserLastLogin, verifyLocalSecret } from './userStorage';
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

export const loadAuthSession = () => readAdminJson<AuthSession | null>(ADMIN_STORAGE_KEYS.authSession, null);
export const saveAuthSession = (session: AuthSession) => writeAdminJson(ADMIN_STORAGE_KEYS.authSession, session);
export const clearAuthSession = () => removeAdminKey(ADMIN_STORAGE_KEYS.authSession);

export const validateSession = () => {
  const session = loadAuthSession();
  if (!session) return { valid: false, message: 'Sesi admin belum tersedia.' };
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    logoutUser('Session expired');
    return { valid: false, message: 'Sesi admin sudah kedaluwarsa. Silakan login ulang.' };
  }
  const user = getUsers().find((item) => item.userId === session.userId);
  if (!user?.isActive) {
    clearAuthSession();
    return { valid: false, message: 'User tidak aktif atau tidak ditemukan.' };
  }
  return { valid: true, session, user, message: 'Sesi valid.' };
};

export const getCurrentUser = (): AdminUser | null => {
  const session = loadAuthSession();
  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) return null;
  return getUsers().find((user) => user.userId === session.userId && user.isActive) ?? null;
};

export const loginUser = (username: string, password: string) => {
  const normalized = username.trim().toLowerCase();
  const user = getUsers().find((item) => item.username === normalized);
  if (!user || !user.isActive) throw new Error('User tidak ditemukan atau tidak aktif.');
  if (!verifyLocalSecret(password, user.passwordHash) && !(user.pinHash && verifyLocalSecret(password, user.pinHash))) throw new Error('Username atau password/PIN salah.');
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
  writeAuditLog({ userId: user.userId, username: user.username, role: user.role, action: 'Login', targetType: 'auth_session', targetId: session.sessionId, description: 'User login admin.' });
  return session;
};

export const logoutUser = (reason = 'User logout admin.') => {
  const session = loadAuthSession();
  if (session) writeAuditLog({ userId: session.userId, username: session.username, role: session.role, action: 'Logout', targetType: 'auth_session', targetId: session.sessionId, description: reason });
  clearAuthSession();
};
