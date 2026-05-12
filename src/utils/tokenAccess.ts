import type { AccessToken, CurrentSession, TokenSessionBinding } from '../types';
import { STORAGE_KEYS, loadCurrentSession, saveCurrentSession } from './storage';
import { buildStartTiming } from './time';
import { normalizeAnswers } from './answerFormat';
import { writeAuditLog } from './auditLog';
import { migrateLegacyTokenState, normalizeTokenState, validateParticipantAccess } from './tokenValidation';

export const TOKEN_STORAGE_KEYS = {
  accessTokens: 'sppg_mmpi2_access_tokens',
  tokenSessions: 'sppg_mmpi2_token_sessions',
  currentSession: 'sppg_mmpi2_current_session',
  results: 'sppg_mmpi2_results',
} as const;

const readJson = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));

export const loadTokens = (): AccessToken[] => readJson<AccessToken[]>(TOKEN_STORAGE_KEYS.accessTokens, []).map(normalizeTokenState);
export const saveTokens = (tokens: AccessToken[]) => writeJson(TOKEN_STORAGE_KEYS.accessTokens, tokens.map(normalizeTokenState));
export const loadTokenSessions = (): TokenSessionBinding[] => readJson<TokenSessionBinding[]>(TOKEN_STORAGE_KEYS.tokenSessions, []).map((session) => ({ ...session, answers: normalizeAnswers(session.answers) }));
export const saveTokenSessions = (sessions: TokenSessionBinding[]) => writeJson(TOKEN_STORAGE_KEYS.tokenSessions, sessions.map((session) => ({ ...session, answers: normalizeAnswers(session.answers) }))); 

export { migrateLegacyTokenState };

export const expireOldTokens = () => {
  const now = Date.now();
  const tokens = loadTokens();
  let changed = false;
  const next = tokens.map((token) => {
    if ((token.status === 'unused' || token.status === 'active') && new Date(token.expiresAt).getTime() < now) {
      changed = true;
      return { ...token, status: 'expired' as const, isEnabled: false };
    }
    return token;
  });
  if (changed) saveTokens(next);
  return next;
};

export const getTokenById = (tokenId: string) => expireOldTokens().find((item) => item.tokenId === tokenId) || null;
export const getTokenByTokenValue = (token: string) => expireOldTokens().find((item) => item.token.toUpperCase() === token.trim().toUpperCase()) || null;

const updateToken = (tokenId: string, updater: (token: AccessToken) => AccessToken) => {
  const tokens = expireOldTokens();
  let updated: AccessToken | null = null;
  const next = tokens.map((token) => {
    if (token.tokenId !== tokenId) return token;
    updated = updater(token);
    return updated;
  });
  saveTokens(next);
  return updated;
};

export const markTokenActive = (tokenId: string, activeSessionId?: string) => updateToken(tokenId, (token) => ({
  ...token,
  isEnabled: true,
  status: 'active',
  usedAttempts: Math.min(token.maxAttempts ?? 1, (token.usedAttempts ?? 0) + 1),
  startedAt: token.startedAt || new Date().toISOString(),
  activeSessionId: activeSessionId ?? token.activeSessionId ?? null,
}));

export const markTokenCompleted = (tokenId: string, resultId: string) => updateToken(tokenId, (token) => ({
  ...token,
  isEnabled: false,
  status: 'completed',
  completedAt: new Date().toISOString(),
  resultId,
}));

export const revokeToken = (tokenId: string) => updateToken(tokenId, (token) => ({ ...token, isEnabled: false, status: 'revoked', activeSessionId: null, revokedAt: new Date().toISOString() }));

export const resetToken = (tokenId: string) => updateToken(tokenId, (token) => ({
  ...token,
  isEnabled: true,
  status: 'unused',
  usedAttempts: 0,
  startedAt: null,
  completedAt: null,
  resultId: null,
  activeSessionId: null,
  disabledAt: null,
  disabledBy: null,
  disableReason: '',
}));

export const bindTokenToSession = (tokenId: string) => {
  const token = getTokenById(tokenId);
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
      name: token.participantName || '',
      participantNumber: token.participantNumber || '',
      dateOfBirth: '',
      age: '',
      gender: '',
      maritalStatus: '',
      education: '',
      occupation: '',
      originWorkUnit: token.unit || '',
      unit: token.unit || '',
      assessmentDate: now.slice(0, 10),
      consent: false,
    },
    answers: {},
    currentIndex: 0,
    mode: 'single',
    status: 'in_progress',
    sessionStatus: 'in_progress',
    mmpiStatus: 'mmpi_in_progress',
    rhStatus: 'not_started',
    ...startTiming,
    lastSavedAt: now,
    updatedAt: now,
  };
  saveCurrentSession(session);
  const tokenSession: TokenSessionBinding = {
    sessionId: session.sessionId || session.id,
    tokenId: token.tokenId,
    token: token.token,
    uniqueKey: token.uniqueKey,
    participant: {},
    answers: {},
    startedAt: startTiming.startedAt,
    lastSavedAt: now,
    status: 'in_progress',
    sessionStatus: 'in_progress',
  };
  saveTokenSessions([tokenSession, ...loadTokenSessions().filter((item) => item.tokenId !== tokenId)]);
  markTokenActive(tokenId, session.sessionId || session.id);
  return session;
};

export const validateSessionToken = (session: CurrentSession | null = loadCurrentSession()) => {
  const validation = validateParticipantAccess({ session, currentRoute: typeof window !== 'undefined' ? window.location.pathname : '' });
  return { valid: validation.allowed, message: validation.message, token: validation.token, reason: validation.reason, session: validation.session };
};

export const disableToken = (tokenId: string, disabledBy = 'admin', disableReason = 'Dinonaktifkan admin') => {
  const now = new Date().toISOString();
  const updated = updateToken(tokenId, (token) => ({ ...token, isEnabled: false, status: 'disabled', disabledAt: now, disabledBy, disableReason, activeSessionId: null }));
  const current = loadCurrentSession();
  if (current?.tokenId === tokenId) {
    const paused = { ...current, sessionStatus: 'paused_token_disabled' as const, status: 'paused_token_disabled' as const, updatedAt: now, lastSavedAt: now };
    saveCurrentSession(paused);
  }
  saveTokenSessions(loadTokenSessions().map((item) => item.tokenId === tokenId ? { ...item, status: 'paused_token_disabled' as const, sessionStatus: 'paused_token_disabled' as const, lastSavedAt: now } : item));
  writeAuditLog('token_disabled', 'access_token', tokenId, `Token dinonaktifkan: ${disableReason}`, { disabledBy, disableReason }, 'warning');
  return updated;
};

export const enableToken = (tokenId: string, enabledBy = 'admin') => {
  const current = getTokenById(tokenId);
  if (!current) return null;
  if (current.status === 'revoked' || current.status === 'completed') return null;
  if (current.status === 'expired' || new Date(current.expiresAt).getTime() < Date.now()) return null;
  const sessions = loadTokenSessions();
  const resumableSession = sessions.find((item) => item.tokenId === tokenId && item.status === 'in_progress' && item.sessionStatus !== 'paused_token_disabled');
  const now = new Date().toISOString();
  const updated = updateToken(tokenId, (token) => ({ ...token, isEnabled: true, status: resumableSession ? 'active' : 'unused', enabledAt: now, enabledBy, disabledAt: null, disabledBy: null, disableReason: '', activeSessionId: resumableSession?.sessionId ?? null }));
  writeAuditLog('token_enabled', 'access_token', tokenId, 'Token diaktifkan kembali.', { enabledBy }, 'info');
  return updated;
};

export const touchTokenSession = (session: CurrentSession) => {
  if (!session.tokenId) return;
  const now = new Date().toISOString();
  saveTokenSessions(loadTokenSessions().map((item) => item.tokenId === session.tokenId ? { ...item, participant: session.identity, answers: normalizeAnswers(session.answers), lastSavedAt: now } : item));
};

export const STORAGE_KEYS_FOR_TOKEN_ACCESS = STORAGE_KEYS;
