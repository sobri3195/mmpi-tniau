import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { ADMIN_STORAGE_KEYS } from './utils/adminStorage';
import { createUser, getUsers, initializeFirstSuperadmin } from './utils/userStorage';
import { clearAuthSession, loadAuthSession, loginUser, logoutUser, saveAuthSession } from './utils/session';

const setupSuperadmin = () => initializeFirstSuperadmin({ displayName: 'Superadmin', username: 'superadmin', password: 'Password123' });

const loginAs = async (username: string, password: string) => {
  await loginUser(username, password);
};

describe('admin localStorage authentication', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('Jika belum ada user, akses /admin/login redirect ke /admin/setup.', async () => {
    window.history.replaceState(null, '', '/admin/login');
    render(<App />);
    await waitFor(() => expect(window.location.pathname).toBe('/admin/setup'));
    expect(await screen.findByText('Setup Superadmin Pertama')).toBeInTheDocument();
  });

  it('Setup superadmin berhasil membuat user role superadmin dan password tidak tersimpan plain text.', async () => {
    window.history.replaceState(null, '', '/admin/setup');
    render(<App />);
    await userEvent.type(await screen.findByLabelText(/nama lengkap/i), 'Komandan Super');
    await userEvent.clear(screen.getByLabelText(/username/i));
    await userEvent.type(screen.getByLabelText(/username/i), 'superadmin');
    await userEvent.type(screen.getByLabelText(/^password/i), 'Password123');
    await userEvent.type(screen.getByLabelText(/konfirmasi password/i), 'Password123');
    await userEvent.click(screen.getByRole('button', { name: /simpan superadmin/i }));
    await waitFor(() => expect(window.location.pathname).toBe('/admin/login'));
    const [user] = getUsers();
    expect(user.role).toBe('superadmin');
    expect(user.passwordHash).not.toBe('Password123');
    expect(JSON.stringify(user)).not.toContain('Password123');
  });

  it('Login salah menambah failedLoginAttempts.', async () => {
    await setupSuperadmin();
    await expect(loginUser('superadmin', 'WrongPassword')).rejects.toThrow('Username atau password salah.');
    expect(getUsers()[0].failedLoginAttempts).toBe(1);
  });

  it('Login benar membuat auth_session.', async () => {
    await setupSuperadmin();
    await loginAs('superadmin', 'Password123');
    const session = loadAuthSession();
    expect(session?.username).toBe('superadmin');
    expect(session?.role).toBe('superadmin');
  });

  it('Session expired redirect ke login.', async () => {
    const user = await setupSuperadmin();
    saveAuthSession({ sessionId: 'expired-session', userId: user.userId, username: user.username, displayName: user.displayName, role: user.role, loginAt: new Date(Date.now() - 10_000).toISOString(), expiresAt: new Date(Date.now() - 1_000).toISOString() });
    window.history.replaceState(null, '', '/admin/dashboard');
    render(<App />);
    await waitFor(() => expect(window.location.pathname).toBe('/admin/login'));
    expect(await screen.findByText(/sesi admin berakhir/i)).toBeInTheDocument();
  });

  it('Tester tidak bisa akses /admin/users.', async () => {
    await setupSuperadmin();
    await createUser({ displayName: 'Tester', username: 'tester1', role: 'tester', password: 'Password123' });
    await loginAs('tester1', 'Password123');
    window.history.replaceState(null, '', '/admin/users');
    render(<App />);
    expect(await screen.findByText('Tidak memiliki akses.', {}, { timeout: 5000 })).toBeInTheDocument();
  });

  it('Specialist bisa akses /admin/review.', async () => {
    await setupSuperadmin();
    await createUser({ displayName: 'Spesialis', username: 'dokter1', role: 'specialist', password: 'Password123' });
    await loginAs('dokter1', 'Password123');
    window.history.replaceState(null, '', '/admin/review');
    render(<App />);
    await waitFor(() => expect(window.location.pathname).toBe('/admin/review'));
    expect(screen.queryByText('Tidak memiliki akses.')).not.toBeInTheDocument();
    expect(await screen.findByText(/admin dashboard/i, {}, { timeout: 5000 })).toBeInTheDocument();
  });

  it('Logout menghapus auth_session.', async () => {
    await setupSuperadmin();
    await loginAs('superadmin', 'Password123');
    expect(localStorage.getItem(ADMIN_STORAGE_KEYS.authSession)).not.toBeNull();
    logoutUser();
    expect(localStorage.getItem(ADMIN_STORAGE_KEYS.authSession)).toBeNull();
    clearAuthSession();
  });
});
