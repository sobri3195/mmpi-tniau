import type { AccessToken, CurrentSession } from '../types';
import { disableToken, enableToken, TOKEN_STORAGE_KEYS } from './tokenAccess';
import { validateParticipantAccess, validateTokenAccess } from './tokenValidation';
import { getParticipantAccessRedirect } from '../components/auth/ParticipantProtectedRoute';

const baseToken = (overrides: Partial<AccessToken> = {}): AccessToken => ({
  tokenId: 'token-1',
  token: 'TNI-AU-AB12-CD34',
  uniqueKey: 'PESERTA-2026-0001',
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

const session = (overrides: Partial<CurrentSession> = {}): CurrentSession => ({
  id: 'session-1',
  sessionId: 'session-1',
  tokenId: 'token-1',
  token: 'TNI-AU-AB12-CD34',
  uniqueKey: 'PESERTA-2026-0001',
  participant: {},
  identity: { name: 'Peserta Test', dateOfBirth: '2000-01-01', age: '26', gender: 'Laki-laki', maritalStatus: 'Belum menikah', education: 'S1', occupation: 'TNI AU', originWorkUnit: 'SPPG', unit: 'SPPG', assessmentDate: '2026-05-11', consent: true },
  answers: {},
  currentIndex: 0,
  mode: 'single',
  status: 'in_progress',
  sessionStatus: 'in_progress',
  updatedAt: '2026-05-11T00:00:00.000Z',
  ...overrides,
});

const saveTokens = (tokens: AccessToken[]) => localStorage.setItem(TOKEN_STORAGE_KEYS.accessTokens, JSON.stringify(tokens));
const saveSession = (value: CurrentSession) => localStorage.setItem(TOKEN_STORAGE_KEYS.currentSession, JSON.stringify(value));

describe('critical participant token validation', () => {
  beforeEach(() => localStorage.clear());

  it('Token OFF tidak bisa login', () => {
    saveTokens([baseToken({ status: 'disabled', isEnabled: false })]);
    expect(validateTokenAccess('TNI-AU-AB12-CD34', 'PESERTA-2026-0001')).toMatchObject({ valid: false, reason: 'token_disabled' });
  });

  it('Token OFF tidak bisa lanjut draft', () => {
    saveTokens([baseToken({ status: 'disabled', isEnabled: false })]);
    saveSession(session());
    expect(validateParticipantAccess({ currentRoute: '/resume' })).toMatchObject({ allowed: false, reason: 'token_disabled' });
  });

  it('Direct URL /test tanpa session redirect ke /access', () => {
    expect(getParticipantAccessRedirect(validateParticipantAccess({ currentRoute: '/test' }).reason)).toBe('/access');
  });

  it('Direct URL /test dengan session tapi token disabled redirect ke /token-disabled', () => {
    saveTokens([baseToken({ status: 'disabled', isEnabled: false })]);
    saveSession(session());
    const validation = validateParticipantAccess({ currentRoute: '/test' });
    expect(validation).toMatchObject({ allowed: false, reason: 'token_disabled' });
    expect(getParticipantAccessRedirect(validation.reason)).toBe('/token-disabled');
  });

  it('Token ON bisa login jika unused dan belum expired', () => {
    saveTokens([baseToken()]);
    expect(validateTokenAccess('TNI-AU-AB12-CD34', 'PESERTA-2026-0001')).toMatchObject({ valid: true });
    const currentSession = JSON.parse(localStorage.getItem(TOKEN_STORAGE_KEYS.currentSession) || '{}');
    expect(currentSession.tokenId).toBe('token-1');
  });

  it('Token completed tidak bisa login ulang', () => {
    saveTokens([baseToken({ status: 'completed', isEnabled: false })]);
    expect(validateTokenAccess('TNI-AU-AB12-CD34', 'PESERTA-2026-0001')).toMatchObject({ valid: false, reason: 'token_completed' });
  });

  it('Token revoked tidak bisa diaktifkan kembali', () => {
    saveTokens([baseToken({ status: 'revoked', isEnabled: false })]);
    expect(enableToken('token-1')).toBeNull();
  });

  it('disableToken() mengubah isEnabled=false dan status=disabled', () => {
    saveTokens([baseToken({ status: 'active' })]);
    saveSession(session());
    disableToken('token-1', 'tester', 'maintenance');
    const [stored] = JSON.parse(localStorage.getItem(TOKEN_STORAGE_KEYS.accessTokens) || '[]') as AccessToken[];
    const current = JSON.parse(localStorage.getItem(TOKEN_STORAGE_KEYS.currentSession) || '{}') as CurrentSession;
    expect(stored).toMatchObject({ isEnabled: false, status: 'disabled', activeSessionId: null });
    expect(current.sessionStatus).toBe('paused_token_disabled');
  });

  it('validateParticipantAccess() menolak session tanpa tokenId', () => {
    saveTokens([baseToken()]);
    saveSession(session({ tokenId: undefined }));
    expect(validateParticipantAccess({ currentRoute: '/test' })).toMatchObject({ allowed: false, reason: 'missing_token' });
  });
});
