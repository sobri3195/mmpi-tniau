import type { AccessToken, CurrentSession } from '../types';
import { TOKEN_STORAGE_KEYS, validateSessionToken } from './tokenAccess';

const baseToken = (overrides: Partial<AccessToken> = {}): AccessToken => ({
  tokenId: 'token-1',
  token: 'MMPI-TEST',
  uniqueKey: 'KEY-123',
  status: 'active',
  createdAt: '2026-05-11T00:00:00.000Z',
  expiresAt: '2099-05-12T00:00:00.000Z',
  maxAttempts: 1,
  usedAttempts: 0,
  ...overrides,
});

const session = (overrides: Partial<CurrentSession> = {}): CurrentSession => ({
  id: 'session-1',
  sessionId: 'session-1',
  tokenId: 'token-1',
  token: 'MMPI-TEST',
  uniqueKey: 'KEY-123',
  participant: {},
  identity: {
    name: 'Peserta Test',
    dateOfBirth: '2000-01-01',
    age: '26',
    gender: 'Laki-laki',
    maritalStatus: 'Belum menikah',
    education: 'S1',
    occupation: 'TNI AU',
    originWorkUnit: 'SPPG',
    unit: 'SPPG',
    assessmentDate: '2026-05-11',
    consent: true,
  },
  answers: {},
  currentIndex: 0,
  mode: 'single',
  status: 'in_progress',
  updatedAt: '2026-05-11T00:00:00.000Z',
  ...overrides,
});

const saveToken = (token: AccessToken) => localStorage.setItem(TOKEN_STORAGE_KEYS.accessTokens, JSON.stringify([token]));

describe('validateSessionToken', () => {
  beforeEach(() => localStorage.clear());

  it('menerima token aktif dengan unique key yang cocok', () => {
    saveToken(baseToken());

    expect(validateSessionToken(session())).toMatchObject({ valid: true, message: '' });
  });

  it('menolak token expired', () => {
    saveToken(baseToken({ status: 'expired' }));

    expect(validateSessionToken(session())).toMatchObject({ valid: false });
  });

  it('menolak token completed', () => {
    saveToken(baseToken({ status: 'completed' }));

    expect(validateSessionToken(session())).toMatchObject({ valid: false });
  });

  it('menolak unique key yang salah', () => {
    saveToken(baseToken());

    expect(validateSessionToken(session({ uniqueKey: 'SALAH' }))).toMatchObject({ valid: false });
  });
});
