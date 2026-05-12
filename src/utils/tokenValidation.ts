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

const TERMINAL_OR_OFF_STATUSES: AccessToken['status'][] = ['disabled', 'revoked', 'completed', 'expired'];
const DRAFT_BLOCKING_STATUSES: AccessToken['status'][] = ['disabled', 'revoked', 'expired', 'completed'];

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

export const isProductionMode = () => Boolean(import.meta.env.PROD);

const isSeededDemoToken = (token: AccessToken) => token.isSeededDemo === true || token.metadata?.isSeededDemo === true;

export const isTokenEnabled = (token: AccessToken | null | undefined) => Boolean(token && token.isEnabled === true && token.status !== 'disabled');

export const normalizeTokenState = (token: AccessToken): AccessToken => {
  const status = token.status as AccessToken['status'];
  const terminalOrOff = TERMINAL_OR_OFF_STATUSES.includes(status);
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
  let tokens = loadTokensRaw();
  let tokensChanged = false;
  if (isProductionMode()) {
    const now = new Date().toISOString();
    tokens = tokens.map((token) => {
      if (!isSeededDemoToken(token) || (token.status === 'disabled' && token.isEnabled === false)) return token;
      tokensChanged = true;
      writeAuditLog('demo_token_disabled_in_production', 'access_token', token.tokenId, 'Demo token disabled in production mode.', { token: token.token }, 'warning');
      return { ...token, status: 'disabled' as const, isEnabled: false, disabledAt: token.disabledAt ?? now, disabledBy: token.disabledBy ?? 'system', disableReason: 'Demo token disabled in production mode', activeSessionId: null };
    });
  }
  saveTokensRaw(tokens);
  const session = loadCurrentSession();
  if (session && !session.tokenId) {
    const legacySession = { ...session, sessionStatus: 'invalid_legacy_session' as const, status: 'invalid_legacy_session' as const, updatedAt: new Date().toISOString() };
    saveCurrentSession(legacySession);
    writeAuditLog('legacy_session_blocked_missing_token', 'current_session', session.sessionId || session.id, 'Sesi lama tanpa tokenId ditandai tidak valid.', {}, 'warning');
    return { tokens, session: legacySession };
  }
  if (tokensChanged) saveTokensRaw(tokens);
  return { tokens, session };
};

const auditDenied = (reason: ParticipantAccessDeniedReason, token: AccessToken | null, session: CurrentSession | null, currentRoute?: string) => {
  const targetId = token?.tokenId ?? session?.sessionId ?? session?.id ?? '';
  const metadata = { currentRoute, reason };
  if (reason === 'missing_token') writeAuditLog('participant_access_denied_empty_token', 'access_token', targetId, 'Akses peserta ditolak karena token/kunci kosong atau sesi tanpa token.', metadata, 'warning');
  if (reason === 'token_not_found') writeAuditLog('participant_access_denied_token_not_found', 'access_token', targetId, 'Akses peserta ditolak karena token tidak ditemukan.', metadata, 'warning');
  if (reason === 'token_disabled') writeAuditLog('participant_access_denied_token_disabled', 'access_token', targetId, `Akses peserta ditolak karena token nonaktif${currentRoute ? ` pada ${currentRoute}` : ''}.`, metadata, 'warning');
  if (reason === 'unique_key_mismatch') writeAuditLog('participant_access_denied_unique_key_mismatch', 'access_token', targetId, 'Akses peserta ditolak karena kunci unik tidak sesuai.', metadata, 'warning');
  if (reason === 'missing_session' && currentRoute) writeAuditLog('participant_access_denied_direct_route', 'route', currentRoute, 'Akses direct route peserta ditolak karena session tidak ada.', metadata, 'warning');
  if (reason === 'paused_token_disabled') writeAuditLog('participant_session_paused_token_disabled', 'current_session', targetId, 'Session peserta terkunci karena token dinonaktifkan.', metadata, 'warning');
};

const denied = (reason: ParticipantAccessDeniedReason, token: AccessToken | null, session: CurrentSession | null, message: string, currentRoute?: string): ParticipantAccessValidationResult => {
  auditDenied(reason, token, session, currentRoute);
  return { allowed: false, reason, token, session, message };
};

const denyTokenState = (token: AccessToken, session: CurrentSession | null, currentRoute?: string) => {
  if (token.isEnabled !== true || token.status === 'disabled') return denied('token_disabled', token, session, 'Token tidak aktif. Hubungi petugas ujian.', currentRoute);
  if (token.status === 'revoked') return denied('token_revoked', token, session, 'Token telah dibatalkan.', currentRoute);
  if (token.status === 'completed') return denied('token_completed', token, session, 'Token sudah digunakan dan tes telah selesai.', currentRoute);
  if (token.status === 'expired' || new Date(token.expiresAt).getTime() < Date.now()) return denied('token_expired', token, session, 'Token sudah kedaluwarsa.', currentRoute);
  return null;
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
    writeAuditLog('participant_access_attempt', 'access_token', inputToken, 'Peserta mencoba verifikasi token akses.', { currentRoute }, 'info');
    if (!inputToken || !inputUniqueKey) return denied('missing_token', null, session, 'Token akses dan kunci unik wajib diisi.', currentRoute);
    token = tokens.find((item) => item.token.toUpperCase() === inputToken) ?? null;
    if (!token) return denied('token_not_found', null, session, 'Token tidak ditemukan. Periksa kembali token yang diberikan petugas.', currentRoute);
    if (token.uniqueKey.toUpperCase() !== inputUniqueKey) return denied('unique_key_mismatch', token, session, 'Kunci unik tidak sesuai.', currentRoute);
  } else {
    if (requireSession && !session) return denied('missing_session', null, null, 'Silakan masukkan token akses dan kunci unik terlebih dahulu.', currentRoute);
    if (!session?.tokenId) return denied('missing_token', null, session, session ? 'Sesi lama tidak memiliki token valid. Silakan masuk ulang menggunakan token dan kunci unik.' : 'Silakan masukkan token akses dan kunci unik terlebih dahulu.', currentRoute);
    token = tokens.find((item) => item.tokenId === session.tokenId) ?? null;
    if (!token) return denied('token_not_found', null, session, 'Token tidak ditemukan. Periksa kembali token yang diberikan petugas.', currentRoute);
    if (session.token && session.token !== token.token) return denied('session_token_mismatch', token, session, 'Session token tidak cocok.', currentRoute);
    if (session.uniqueKey && session.uniqueKey !== token.uniqueKey) return denied('session_token_mismatch', token, session, 'Session token tidak cocok.', currentRoute);
  }

  const tokenStateDenial = denyTokenState(token, session, currentRoute);
  if (tokenStateDenial) return tokenStateDenial;
  if (!requireUniqueKey && session?.sessionStatus === 'paused_token_disabled') return denied('paused_token_disabled', token, session, 'Token tidak aktif. Hubungi petugas ujian.', currentRoute);
  if (!requireUniqueKey && session?.sessionStatus === 'completed') return denied('token_completed', token, session, 'Token sudah digunakan dan tes telah selesai.', currentRoute);
  if (!requireUniqueKey && session?.status === 'completed') return denied('token_completed', token, session, 'Token sudah digunakan dan tes telah selesai.', currentRoute);
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
  const trimmedToken = tokenValue.trim();
  const trimmedUniqueKey = uniqueKeyValue.trim();
  const validation = validateParticipantAccess({ requireUniqueKey: true, token: trimmedToken, uniqueKey: trimmedUniqueKey, currentRoute: '/access' });
  if (!validation.allowed || !validation.token) return { valid: false, message: validation.message, token: validation.token, session: validation.session, reason: validation.reason };
  if (validation.token.status === 'active' && validation.token.singleActiveSessionOnly !== false) return { valid: false, message: 'Token sudah digunakan.', token: validation.token, session: null, reason: 'session_token_mismatch' as const };
  if ((validation.token.usedAttempts ?? 0) >= (validation.token.maxAttempts ?? 1)) return { valid: false, message: 'Token sudah melebihi batas percobaan.', token: validation.token, session: null, reason: 'token_completed' as const };
  const session = activateTokenSession(validation.token.tokenId);
  if (session) writeAuditLog('participant_access_success', 'access_token', validation.token.tokenId, 'Peserta berhasil verifikasi token akses.', { sessionId: session.sessionId || session.id }, 'info');
  return { valid: Boolean(session), message: session ? '' : 'Token tidak ditemukan. Periksa kembali token yang diberikan petugas.', token: validation.token, session, reason: session ? 'valid' as const : 'token_not_found' as const };
};

export const getValidDraftSession = () => {
  const session = loadCurrentSession();
  const validation = validateParticipantAccess({ session, currentRoute: '/resume' });
  if (!validation.allowed || !validation.session) {
    writeAuditLog('continue_draft_blocked_invalid_token', 'current_session', session?.sessionId || session?.id || '', 'Lanjutkan draft diblokir karena session/token tidak valid.', { reason: validation.reason }, 'warning');
    return null;
  }
  if (!validation.session.tokenId || validation.token?.isEnabled !== true || !validation.token || DRAFT_BLOCKING_STATUSES.includes(validation.token.status)) return null;
  if (validation.session.sessionStatus === 'paused_token_disabled' || validation.session.sessionStatus === 'completed' || validation.session.status === 'completed') return null;
  return validation.session;
};

export const canShowContinueDraft = () => Boolean(getValidDraftSession());

export const createDemoTokensForDevelopmentOnly = () => {
  if (isProductionMode()) return [];
  const tokens = loadTokensRaw();
  const exists = tokens.some((token) => token.token === 'TNI-AU-AB12-CD34' || token.uniqueKey === 'PESERTA-2026-0001');
  if (exists) return tokens;
  const now = new Date().toISOString();
  const demoToken: AccessToken = {
    tokenId: crypto.randomUUID(),
    token: 'TNI-AU-AB12-CD34',
    uniqueKey: 'PESERTA-2026-0001',
    status: 'unused',
    isEnabled: true,
    createdAt: now,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    maxAttempts: 1,
    usedAttempts: 0,
    disabledAt: null,
    disabledBy: null,
    disableReason: '',
    enabledAt: null,
    enabledBy: null,
    activeSessionId: null,
    metadata: { isSeededDemo: true },
    isSeededDemo: true,
    notes: 'Demo token for development only',
  };
  const next = [demoToken, ...tokens];
  saveTokensRaw(next);
  return next;
};
