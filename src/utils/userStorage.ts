import { ADMIN_STORAGE_KEYS, readAdminJson, writeAdminJson } from './adminStorage';
import type { AdminRole } from './roles';
import { writeAuditLog } from './auditLog';
import { generateSalt, hashPassword, verifyPassword } from './passwordHash';

export interface UserSignature {
  name: string;
  title: string;
  licenseNumber: string;
  institution: string;
}

export interface AdminUser {
  userId: string;
  username: string;
  displayName: string;
  role: AdminRole;
  passwordHash: string;
  passwordSalt: string;
  pinHash: string;
  pinSalt: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  lastLoginAt: string | null;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  permissions: string[];
  signature: UserSignature;
  notes: string;
}

export interface UserInput {
  username: string;
  displayName: string;
  role: AdminRole;
  password?: string;
  pin?: string;
  isActive?: boolean;
  permissions?: string[];
  signature?: Partial<UserSignature>;
  notes?: string;
  createdBy?: string;
}

export const LOCAL_SECURITY_WARNING = 'Login berbasis localStorage bukan keamanan server-level. Untuk produksi resmi gunakan backend, database terenkripsi, autentikasi server-side, MFA/SSO, dan audit log server-side.';

export const hashLocalSecret = (secret: string) => btoa(unescape(encodeURIComponent(`sppg-local:${secret}`))).split('').reverse().join('');
export const verifyLocalSecret = (secret: string, hash: string) => hashLocalSecret(secret) === hash;
export const getUsers = () => readAdminJson<AdminUser[]>(ADMIN_STORAGE_KEYS.users, []).map(normalizeUser);
export const saveUsers = (users: AdminUser[]) => writeAdminJson(ADMIN_STORAGE_KEYS.users, users.map(normalizeUser));
export const hasAnyUser = () => getUsers().length > 0;

const normalizeUsername = (username: string) => username.trim().toLowerCase();
const defaultSignature = (input?: Partial<UserSignature>): UserSignature => ({
  name: input?.name ?? '',
  title: input?.title ?? '',
  licenseNumber: input?.licenseNumber ?? '',
  institution: input?.institution ?? '',
});

const normalizeUser = (user: Partial<AdminUser> & { userId: string; username: string; displayName: string; role: AdminRole; passwordHash: string }): AdminUser => ({
  userId: user.userId,
  username: normalizeUsername(user.username),
  displayName: user.displayName,
  role: user.role,
  passwordHash: user.passwordHash,
  passwordSalt: user.passwordSalt ?? '',
  pinHash: user.pinHash ?? '',
  pinSalt: user.pinSalt ?? '',
  isActive: user.isActive ?? true,
  createdAt: user.createdAt ?? new Date().toISOString(),
  createdBy: user.createdBy ?? '',
  lastLoginAt: user.lastLoginAt ?? null,
  failedLoginAttempts: user.failedLoginAttempts ?? 0,
  lockedUntil: user.lockedUntil ?? null,
  permissions: user.permissions ?? [],
  signature: defaultSignature(user.signature),
  notes: user.notes ?? '',
});

const assertPasswordRules = (password: string) => {
  if (password.length < 8) throw new Error('Password minimal 8 karakter.');
};

const assertUsernameRules = (username: string) => {
  if (normalizeUsername(username).length < 4) throw new Error('Username minimal 4 karakter.');
};

const buildSecretHashes = async (password: string, pin?: string) => {
  const passwordSalt = generateSalt();
  const passwordHash = await hashPassword(password, passwordSalt);
  const trimmedPin = pin?.trim() ?? '';
  if (trimmedPin && !/^\d{4,}$/.test(trimmedPin)) throw new Error('PIN jika diisi minimal 4 digit.');
  const pinSalt = trimmedPin ? generateSalt() : '';
  const pinHash = trimmedPin ? await hashPassword(trimmedPin, pinSalt) : '';
  return { passwordHash, passwordSalt, pinHash, pinSalt };
};

export const initializeFirstSuperadmin = async (input: { username: string; displayName: string; password: string; pin?: string }) => {
  if (hasAnyUser()) throw new Error('Setup awal sudah dilakukan.');
  assertUsernameRules(input.username);
  assertPasswordRules(input.password);
  const now = new Date().toISOString();
  const hashes = await buildSecretHashes(input.password, input.pin);
  const user: AdminUser = {
    userId: crypto.randomUUID(),
    username: normalizeUsername(input.username),
    displayName: input.displayName.trim(),
    role: 'superadmin',
    ...hashes,
    isActive: true,
    createdAt: now,
    createdBy: '',
    lastLoginAt: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    permissions: [],
    signature: defaultSignature({ name: input.displayName.trim(), title: 'Superadmin' }),
    notes: 'Superadmin pertama dibuat melalui setup awal.',
  };
  saveUsers([user]);
  writeAuditLog({ userId: user.userId, username: user.username, role: user.role, action: 'first_superadmin_created', targetType: 'user', targetId: user.userId, description: 'Superadmin pertama dibuat.', severity: 'info' });
  return user;
};

export const createUser = async (input: UserInput & { password: string }) => {
  const users = getUsers();
  const username = normalizeUsername(input.username);
  assertUsernameRules(username);
  if (users.some((user) => user.username === username)) throw new Error('Username sudah digunakan.');
  assertPasswordRules(input.password);
  const now = new Date().toISOString();
  const hashes = await buildSecretHashes(input.password, input.pin);
  const user: AdminUser = {
    userId: crypto.randomUUID(),
    username,
    displayName: input.displayName.trim(),
    role: input.role,
    ...hashes,
    isActive: input.isActive ?? true,
    createdAt: now,
    createdBy: input.createdBy ?? '',
    lastLoginAt: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    permissions: input.permissions ?? [],
    signature: defaultSignature(input.signature),
    notes: input.notes ?? '',
  };
  saveUsers([user, ...users]);
  writeAuditLog({ action: 'user_created', targetType: 'user', targetId: user.userId, description: `Membuat user ${user.username}.`, severity: 'info' });
  return user;
};

export const updateUser = (userId: string, patch: Partial<UserInput> & { resetFailedLoginAttempts?: boolean }) => {
  const users = getUsers();
  const before = users.find((user) => user.userId === userId);
  const next = users.map((user) => user.userId === userId ? {
    ...user,
    username: patch.username ? normalizeUsername(patch.username) : user.username,
    displayName: patch.displayName ?? user.displayName,
    role: patch.role ?? user.role,
    isActive: patch.isActive ?? user.isActive,
    permissions: patch.permissions ?? user.permissions,
    signature: { ...user.signature, ...(patch.signature ?? {}) },
    notes: patch.notes ?? user.notes,
    failedLoginAttempts: patch.resetFailedLoginAttempts ? 0 : user.failedLoginAttempts,
    lockedUntil: patch.resetFailedLoginAttempts ? null : user.lockedUntil,
  } : user);
  saveUsers(next);
  const updated = next.find((user) => user.userId === userId) ?? null;
  const action = before && !before.isActive && updated?.isActive ? 'user_enabled' : before?.isActive && updated && !updated.isActive ? 'user_disabled' : 'user_updated';
  writeAuditLog({ action, targetType: 'user', targetId: userId, description: 'Memperbarui data user.', severity: action === 'user_disabled' ? 'warning' : 'info' });
  return updated;
};

export const disableUser = (userId: string) => updateUser(userId, { isActive: false });
export const enableUser = (userId: string) => updateUser(userId, { isActive: true });
export const resetFailedLoginAttempts = (userId: string) => updateUser(userId, { resetFailedLoginAttempts: true });

export const resetUserPassword = async (userId: string, newPassword: string, newPin?: string) => {
  assertPasswordRules(newPassword);
  const hashes = await buildSecretHashes(newPassword, newPin);
  const users = getUsers();
  saveUsers(users.map((user) => user.userId === userId ? { ...user, ...hashes, failedLoginAttempts: 0, lockedUntil: null } : user));
  writeAuditLog({ action: 'password_reset', targetType: 'user', targetId: userId, description: 'Reset password user.', severity: 'warning' });
};

export const touchUserLastLogin = (userId: string) => {
  const users = getUsers();
  saveUsers(users.map((user) => user.userId === userId ? { ...user, lastLoginAt: new Date().toISOString(), failedLoginAttempts: 0, lockedUntil: null } : user));
};

export const recordFailedLogin = (userId: string) => {
  const users = getUsers();
  let locked = false;
  saveUsers(users.map((user) => {
    if (user.userId !== userId) return user;
    const failedLoginAttempts = user.failedLoginAttempts + 1;
    locked = failedLoginAttempts >= 5;
    return { ...user, failedLoginAttempts, lockedUntil: locked ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : user.lockedUntil };
  }));
  return locked;
};

export const isUserLocked = (user: AdminUser) => Boolean(user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now());

export const verifyUserPassword = async (user: AdminUser, secret: string) => {
  if (await verifyPassword(secret, user.passwordHash, user.passwordSalt)) return true;
  if (user.pinHash && user.pinSalt && await verifyPassword(secret, user.pinHash, user.pinSalt)) return true;
  // Compatibility for legacy local hashes; immediately re-save should be performed by user reset in management.
  return Boolean((user.passwordHash && !user.passwordSalt && verifyLocalSecret(secret, user.passwordHash)) || (user.pinHash && !user.pinSalt && verifyLocalSecret(secret, user.pinHash)));
};
