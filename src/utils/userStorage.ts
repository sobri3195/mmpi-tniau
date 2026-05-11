import { ADMIN_STORAGE_KEYS, readAdminJson, writeAdminJson } from './adminStorage';
import type { AdminRole } from './roles';
import { writeAuditLog } from './auditLog';

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
  pinHash?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string;
  permissions: string[];
  signature: UserSignature;
  notes: string;
}

export interface UserInput {
  username: string;
  displayName: string;
  role: AdminRole;
  password?: string;
  isActive?: boolean;
  permissions?: string[];
  signature?: Partial<UserSignature>;
  notes?: string;
}

export const hashLocalSecret = (secret: string) => btoa(unescape(encodeURIComponent(`sppg-local:${secret}`))).split('').reverse().join('');
export const verifyLocalSecret = (secret: string, hash: string) => hashLocalSecret(secret) === hash;
export const getUsers = () => readAdminJson<AdminUser[]>(ADMIN_STORAGE_KEYS.users, []);
export const saveUsers = (users: AdminUser[]) => writeAdminJson(ADMIN_STORAGE_KEYS.users, users);
export const hasAnyUser = () => getUsers().length > 0;

const normalizeUsername = (username: string) => username.trim().toLowerCase();
const defaultSignature = (input?: Partial<UserSignature>): UserSignature => ({
  name: input?.name ?? '',
  title: input?.title ?? '',
  licenseNumber: input?.licenseNumber ?? '',
  institution: input?.institution ?? '',
});

export const initializeFirstSuperadmin = (input: { username: string; displayName: string; password: string }) => {
  if (hasAnyUser()) throw new Error('Setup awal sudah dilakukan.');
  if (input.password.length < 4) throw new Error('Password/PIN minimal 4 karakter.');
  const now = new Date().toISOString();
  const user: AdminUser = {
    userId: crypto.randomUUID(),
    username: normalizeUsername(input.username),
    displayName: input.displayName.trim(),
    role: 'superadmin',
    passwordHash: hashLocalSecret(input.password),
    pinHash: hashLocalSecret(input.password),
    isActive: true,
    createdAt: now,
    lastLoginAt: '',
    permissions: [],
    signature: defaultSignature({ name: input.displayName.trim(), title: 'Superadmin' }),
    notes: 'Superadmin pertama dibuat melalui setup awal.',
  };
  saveUsers([user]);
  writeAuditLog({ userId: user.userId, username: user.username, role: user.role, action: 'Create user', targetType: 'user', targetId: user.userId, description: 'Membuat superadmin pertama.' });
  return user;
};

export const createUser = (input: UserInput & { password: string }) => {
  const users = getUsers();
  const username = normalizeUsername(input.username);
  if (users.some((user) => user.username === username)) throw new Error('Username sudah digunakan.');
  if (input.password.length < 4) throw new Error('Password/PIN minimal 4 karakter.');
  const now = new Date().toISOString();
  const user: AdminUser = {
    userId: crypto.randomUUID(),
    username,
    displayName: input.displayName.trim(),
    role: input.role,
    passwordHash: hashLocalSecret(input.password),
    pinHash: hashLocalSecret(input.password),
    isActive: input.isActive ?? true,
    createdAt: now,
    lastLoginAt: '',
    permissions: input.permissions ?? [],
    signature: defaultSignature(input.signature),
    notes: input.notes ?? '',
  };
  saveUsers([user, ...users]);
  writeAuditLog({ action: 'Create user', targetType: 'user', targetId: user.userId, description: `Membuat user ${user.username}.` });
  return user;
};

export const updateUser = (userId: string, patch: Partial<UserInput>) => {
  const users = getUsers();
  const next = users.map((user) => user.userId === userId ? {
    ...user,
    username: patch.username ? normalizeUsername(patch.username) : user.username,
    displayName: patch.displayName ?? user.displayName,
    role: patch.role ?? user.role,
    isActive: patch.isActive ?? user.isActive,
    permissions: patch.permissions ?? user.permissions,
    signature: { ...user.signature, ...(patch.signature ?? {}) },
    notes: patch.notes ?? user.notes,
  } : user);
  saveUsers(next);
  writeAuditLog({ action: 'Update user', targetType: 'user', targetId: userId, description: 'Memperbarui data user.' });
  return next.find((user) => user.userId === userId) ?? null;
};

export const disableUser = (userId: string) => {
  const user = updateUser(userId, { isActive: false });
  writeAuditLog({ action: 'Disable user', targetType: 'user', targetId: userId, description: `Menonaktifkan user ${user?.username ?? userId}.` });
  return user;
};

export const resetUserPassword = (userId: string, newPassword: string) => {
  if (newPassword.length < 4) throw new Error('Password/PIN minimal 4 karakter.');
  const users = getUsers();
  const next = users.map((user) => user.userId === userId ? { ...user, passwordHash: hashLocalSecret(newPassword), pinHash: hashLocalSecret(newPassword) } : user);
  saveUsers(next);
  writeAuditLog({ action: 'Reset password', targetType: 'user', targetId: userId, description: 'Reset password/PIN user.' });
};

export const touchUserLastLogin = (userId: string) => {
  const users = getUsers();
  saveUsers(users.map((user) => user.userId === userId ? { ...user, lastLoginAt: new Date().toISOString() } : user));
};
