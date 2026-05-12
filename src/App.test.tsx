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
});
