import type { AccessToken, CurrentSession, TokenSessionBinding } from '../types';
import { loadCurrentSession, saveCurrentSession } from './storage';
import { buildStartTiming } from './time';
import { writeAuditLog } from './auditLog';

const ACCESS_TOKENS_KEY = 'sppg_mmpi2_access_tokens';
const TOKEN_SESSIONS_KEY = 'sppg_mmpi2_token_sessions';

export type ParticipantAccessDeniedReason =
  | 'valid'
  | 'missing_session'
  | 'missing_token'
  | 'token_not_found'
  | 'unique_key_mismatch'
  | 'token_disabled'
  | 'token_revoked'
  | 'token_expired'
  | 'token_completed'
  | 'session_token_mismatch'
  | 'paused_token_disabled';

export interface ValidateParticipantAccessOptions {
  requireUniqueKey?: boolean;
  token?: string;
  uniqueKey?: string;
  session?: CurrentSession | null;
  currentRoute?: string;
  requireSession?: boolean;
}

export interface ParticipantAccessValidationResult {
  allowed: boolean;
  reason: ParticipantAccessDeniedReason;
  token: AccessToken | null;
  session: CurrentSession | null;
  message: string;
}

const readJson = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(value));
};

export const isTokenEnabled = (token: AccessToken | null | undefined) => Boolean(token && token.isEnabled === true && token.status !== 'disabled');

export const normalizeTokenState = (token: AccessToken): AccessToken => {
  const status = token.status as AccessToken['status'];
  const terminalOrOff = ['disabled', 'revoked', 'completed', 'expired'].includes(status);
  return {
    ...token,
    isEnabled: typeof token.isEnabled === 'boolean' ? token.isEnabled : !terminalOrOff,
    disabledAt: token.disabledAt ?? null,
    disabledBy: token.disabledBy ?? null,
    disableReason: token.disableReason ?? '',
    enabledAt: token.enabledAt ?? null,
    enabledBy: token.enabledBy ?? null,
    activeSessionId: token.activeSessionId ?? null,
  };
};

const loadTokensRaw = () => readJson<AccessToken[]>(ACCESS_TOKENS_KEY, []).map(normalizeTokenState);
const saveTokensRaw = (tokens: AccessToken[]) => writeJson(ACCESS_TOKENS_KEY, tokens.map(normalizeTokenState));
const loadTokenSessionsRaw = () => readJson<TokenSessionBinding[]>(TOKEN_SESSIONS_KEY, []);
const saveTokenSessionsRaw = (sessions: TokenSessionBinding[]) => writeJson(TOKEN_SESSIONS_KEY, sessions);

export const migrateLegacyTokenState = () => {
  const tokens = loadTokensRaw();
  saveTokensRaw(tokens);
  const session = loadCurrentSession();
  if (session && !session.tokenId) {
    const legacySession = { ...session, sessionStatus: 'invalid_legacy_session' as const, status: 'invalid_legacy_session' as const, updatedAt: new Date().toISOString() };
    saveCurrentSession(legacySession);
    writeAuditLog('legacy_session_blocked_missing_token', 'current_session', session.sessionId || session.id, 'Sesi lama tanpa tokenId ditandai tidak valid.', {}, 'warning');
    return { tokens, session: legacySession };
  }
  return { tokens, session };
};

const denied = (reason: ParticipantAccessDeniedReason, token: AccessToken | null, session: CurrentSession | null, message: string, currentRoute?: string): ParticipantAccessValidationResult => {
  if (reason === 'token_disabled') writeAuditLog('participant_access_denied_token_disabled', 'access_token', token?.tokenId ?? '', `Akses peserta ditolak karena token nonaktif${currentRoute ? ` pada ${currentRoute}` : ''}.`, { currentRoute }, 'warning');
  if (reason === 'missing_token') writeAuditLog('participant_access_denied_missing_token', 'current_session', session?.sessionId || session?.id || '', 'Akses peserta ditolak karena sesi tidak memiliki tokenId.', { currentRoute }, 'warning');
  if (reason === 'missing_session' && currentRoute) writeAuditLog('participant_access_denied_direct_route', 'route', currentRoute, 'Akses direct route peserta ditolak karena session tidak ada.', { currentRoute }, 'warning');
  if (reason === 'paused_token_disabled') writeAuditLog('participant_session_paused_token_disabled', 'current_session', session?.sessionId || session?.id || '', 'Session peserta terkunci karena token dinonaktifkan.', { currentRoute }, 'warning');
  return { allowed: false, reason, token, session, message };
};

export const validateParticipantAccess = (options: ValidateParticipantAccessOptions = {}): ParticipantAccessValidationResult => {
  const { tokens } = migrateLegacyTokenState();
  const currentRoute = options.currentRoute;
  const requireUniqueKey = options.requireUniqueKey === true;
  const requireSession = options.requireSession ?? !requireUniqueKey;
  const inputToken = options.token?.trim().toUpperCase() ?? '';
  const inputUniqueKey = options.uniqueKey?.trim().toUpperCase() ?? '';
  const session = options.session !== undefined ? options.session : loadCurrentSession();

  let token: AccessToken | null = null;
  if (requireUniqueKey) {
    if (!inputToken) return denied('missing_token', null, session, 'Token akses wajib diisi.', currentRoute);
    token = tokens.find((item) => item.token.toUpperCase() === inputToken) ?? null;
    if (!token) return denied('token_not_found', null, session, 'Token tidak ditemukan.', currentRoute);
    if (token.uniqueKey.toUpperCase() !== inputUniqueKey) return denied('unique_key_mismatch', token, session, 'Unique key tidak sesuai.', currentRoute);
  } else {
    if (requireSession && !session) return denied('missing_session', null, null, 'Silakan masukkan token akses dan unique key terlebih dahulu.', currentRoute);
    if (!session?.tokenId) return denied('missing_token', null, session, session ? 'Sesi lama tidak memiliki token valid. Silakan masuk ulang menggunakan token dan unique key.' : 'Silakan masukkan token akses dan unique key terlebih dahulu.', currentRoute);
    token = tokens.find((item) => item.tokenId === session.tokenId) ?? null;
    if (!token) return denied('token_not_found', null, session, 'Token tidak ditemukan.', currentRoute);
    if (session.token && session.token !== token.token) return denied('session_token_mismatch', token, session, 'Session token tidak cocok.', currentRoute);
  }

  if (!requireUniqueKey && session?.uniqueKey && session.uniqueKey !== token.uniqueKey) return denied('session_token_mismatch', token, session, 'Session token tidak cocok.', currentRoute);
  if (token.status === 'disabled') return denied('token_disabled', token, session, 'Token akses Anda sedang dinonaktifkan oleh admin/petugas ujian.', currentRoute);
  if (token.status === 'revoked') return denied('token_revoked', token, session, 'Token dibatalkan admin.', currentRoute);
  if (token.status === 'completed') return denied('token_completed', token, session, 'Token sudah selesai dan tidak dapat dipakai ulang.', currentRoute);
  if (token.status === 'expired' || new Date(token.expiresAt).getTime() < Date.now()) return denied('token_expired', token, session, 'Token sudah kedaluwarsa. Hubungi admin.', currentRoute);
  if (token.isEnabled !== true) return denied('token_disabled', token, session, 'Token akses Anda sedang dinonaktifkan oleh admin/petugas ujian.', currentRoute);
  if (!requireUniqueKey && session?.sessionStatus === 'paused_token_disabled') return denied('paused_token_disabled', token, session, 'Token akses Anda sedang dinonaktifkan oleh admin/petugas ujian.', currentRoute);
  if (!requireUniqueKey && session?.tokenId !== token.tokenId) return denied('session_token_mismatch', token, session, 'Session token tidak cocok.', currentRoute);

  return { allowed: true, reason: 'valid', token, session, message: '' };
};

export const activateTokenSession = (tokenId: string) => {
  const tokens = loadTokensRaw();
  const token = tokens.find((item) => item.tokenId === tokenId) ?? null;
  if (!token) return null;
  const now = new Date().toISOString();
  const startTiming = buildStartTiming(new Date(now));
  const session: CurrentSession = {
    id: crypto.randomUUID(),
    sessionId: crypto.randomUUID(),
    tokenId: token.tokenId,
    token: token.token,
    uniqueKey: token.uniqueKey,
    participant: {},
    identity: {
      name: token.participantName || '', participantNumber: token.participantNumber || '', dateOfBirth: '', age: '', gender: '', maritalStatus: '', education: '', occupation: '', originWorkUnit: token.unit || '', unit: token.unit || '', assessmentDate: now.slice(0, 10), consent: false,
    },
    answers: {}, currentIndex: 0, mode: 'single', status: 'in_progress', sessionStatus: 'in_progress', mmpiStatus: 'mmpi_in_progress', rhStatus: 'not_started', ...startTiming, lastSavedAt: now, updatedAt: now,
  };
  saveCurrentSession(session);
  const tokenSession: TokenSessionBinding = { sessionId: session.sessionId || session.id, tokenId: token.tokenId, token: token.token, uniqueKey: token.uniqueKey, participant: {}, answers: {}, startedAt: startTiming.startedAt, lastSavedAt: now, status: 'in_progress', sessionStatus: 'in_progress' };
  saveTokenSessionsRaw([tokenSession, ...loadTokenSessionsRaw().filter((item) => item.tokenId !== tokenId)]);
  saveTokensRaw(tokens.map((item) => item.tokenId === tokenId ? { ...item, isEnabled: true, status: 'active', usedAttempts: Math.min(item.maxAttempts ?? 1, (item.usedAttempts ?? 0) + 1), startedAt: item.startedAt || now, activeSessionId: session.sessionId || session.id } : item));
  return session;
};

export const validateTokenAccess = (tokenValue: string, uniqueKeyValue: string) => {
  const validation = validateParticipantAccess({ requireUniqueKey: true, token: tokenValue, uniqueKey: uniqueKeyValue, currentRoute: '/access' });
  if (!validation.allowed || !validation.token) return { valid: false, message: validation.message, token: validation.token, session: validation.session, reason: validation.reason };
  if (validation.token.status === 'active' && validation.token.singleActiveSessionOnly !== false) return { valid: false, message: 'Token sudah digunakan.', token: validation.token, session: null, reason: 'session_token_mismatch' as const };
  if ((validation.token.usedAttempts ?? 0) >= (validation.token.maxAttempts ?? 1)) return { valid: false, message: 'Token sudah melebihi batas percobaan.', token: validation.token, session: null, reason: 'token_completed' as const };
  const session = activateTokenSession(validation.token.tokenId);
  return { valid: Boolean(session), message: session ? '' : 'Token tidak ditemukan.', token: validation.token, session, reason: session ? 'valid' as const : 'token_not_found' as const };
};
