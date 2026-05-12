import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { TokenAccessPage } from './TokenAccessPage';
import type { AccessToken } from '../types';
import { TOKEN_STORAGE_KEYS } from '../utils/tokenAccess';

const baseToken = (overrides: Partial<AccessToken> = {}): AccessToken => ({
  tokenId: 'token-1',
  token: 'ACTIVE-TOKEN',
  uniqueKey: 'ACTIVE-KEY',
  status: 'unused',
  isEnabled: true,
  createdAt: '2026-05-11T00:00:00.000Z',
  expiresAt: '2099-05-12T00:00:00.000Z',
  maxAttempts: 1,
  usedAttempts: 0,
  disabledAt: null,
  disabledBy: null,
  disableReason: '',
  enabledAt: null,
  enabledBy: null,
  activeSessionId: null,
  ...overrides,
});

const saveTokens = (tokens: AccessToken[]) => localStorage.setItem(TOKEN_STORAGE_KEYS.accessTokens, JSON.stringify(tokens));

describe('TokenAccessPage', () => {
  beforeEach(() => localStorage.clear());

  it('render dengan input token dan kunci unik kosong', () => {
    render(<TokenAccessPage onVerified={() => undefined} />);

    expect(screen.getByLabelText(/token akses/i)).toHaveValue('');
    expect(screen.getByLabelText(/kunci unik/i)).toHaveValue('');
  });

  it('menampilkan token contoh sebagai placeholder tetapi value tetap kosong', () => {
    render(<TokenAccessPage onVerified={() => undefined} />);

    expect(screen.getByPlaceholderText('Contoh: TNI-AU-AB12-CD34')).toHaveValue('');
    expect(screen.getByPlaceholderText('Contoh: PESERTA-2026-0001')).toHaveValue('');
  });

  it('disable tombol Verifikasi token saat input kosong atau hanya spasi', async () => {
    const user = userEvent.setup();
    render(<TokenAccessPage onVerified={() => undefined} />);

    const verifyButton = screen.getByRole('button', { name: /verifikasi token/i });
    expect(verifyButton).toBeDisabled();

    await user.type(screen.getByLabelText(/token akses/i), '   ');
    await user.type(screen.getByLabelText(/kunci unik/i), '   ');
    expect(verifyButton).toBeDisabled();
  });

  it('menolak token disabled meskipun token dan kunci unik benar', async () => {
    const user = userEvent.setup();
    saveTokens([baseToken({ status: 'disabled', isEnabled: false })]);
    render(<TokenAccessPage onVerified={() => undefined} />);

    await user.type(screen.getByLabelText(/token akses/i), 'ACTIVE-TOKEN');
    await user.type(screen.getByLabelText(/kunci unik/i), 'ACTIVE-KEY');
    await user.click(screen.getByRole('button', { name: /verifikasi token/i }));

    expect(screen.getByText('Token tidak aktif. Hubungi petugas ujian.')).toBeInTheDocument();
    expect(localStorage.getItem(TOKEN_STORAGE_KEYS.currentSession)).toBeNull();
  });

  it('menerima token active dengan kunci unik benar', async () => {
    const user = userEvent.setup();
    const onVerified = vi.fn();
    saveTokens([baseToken()]);
    render(<TokenAccessPage onVerified={onVerified} />);

    await user.type(screen.getByLabelText(/token akses/i), 'ACTIVE-TOKEN');
    await user.type(screen.getByLabelText(/kunci unik/i), 'ACTIVE-KEY');
    await user.click(screen.getByRole('button', { name: /verifikasi token/i }));

    expect(onVerified).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem(TOKEN_STORAGE_KEYS.currentSession) || '{}')).toMatchObject({ tokenId: 'token-1' });
  });
});
