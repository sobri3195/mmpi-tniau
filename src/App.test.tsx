import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('merender aplikasi tanpa crash dan menampilkan navigasi utama peserta tanpa tombol Admin mencolok', async () => {
    render(<App />);

    expect(screen.getByText('MMPI TNI AU')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mulai tes/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /admin/i })).not.toBeInTheDocument();
  });

  it('redirect direct route /test tanpa token ke /access', async () => {
    window.history.replaceState(null, '', '/test');

    render(<App />);

    await waitFor(() => expect(window.location.pathname).toBe('/access'));
    expect(await screen.findByText('Masuk Tes MMPI TNI AU')).toBeInTheDocument();
    expect(screen.getByText('Silakan masukkan token akses dan kunci unik terlebih dahulu.')).toBeInTheDocument();
  });

  it('halaman /access memakai header minimal tanpa Lanjutkan Draft atau tombol Admin besar', async () => {
    window.history.replaceState(null, '', '/access');
    localStorage.setItem('sppg_mmpi2_current_session', JSON.stringify({ id: 'legacy-session', answers: {}, status: 'Draft' }));

    render(<App />);

    expect(await screen.findByText('Masuk Tes MMPI TNI AU')).toBeInTheDocument();
    expect(screen.queryByText(/lanjutkan draft/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /dashboard admin|admin/i })).not.toBeInTheDocument();
    expect(screen.queryByText('TNI-AU-AB12-CD34')).not.toBeInTheDocument();
    expect(screen.queryByText('PESERTA-2026-0001')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/token akses/i)).toHaveValue('');
    expect(screen.getByLabelText(/kunci unik/i)).toHaveValue('');
    expect(screen.getByRole('button', { name: /verifikasi token/i })).toBeDisabled();
    await waitFor(() => expect(localStorage.getItem('sppg_mmpi2_current_session')).toBeNull());
  });

});
