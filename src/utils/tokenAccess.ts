import type { AccessToken, CurrentSession, TokenSessionBinding } from '../types';
import { STORAGE_KEYS, loadCurrentSession, saveCurrentSession } from './storage';
import { buildStartTiming } from './time';
import { normalizeAnswers } from './answerFormat';

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

export const loadTokens = (): AccessToken[] => readJson<AccessToken[]>(TOKEN_STORAGE_KEYS.accessTokens, []);
export const saveTokens = (tokens: AccessToken[]) => writeJson(TOKEN_STORAGE_KEYS.accessTokens, tokens);
export const loadTokenSessions = (): TokenSessionBinding[] => readJson<TokenSessionBinding[]>(TOKEN_STORAGE_KEYS.tokenSessions, []).map((session) => ({ ...session, answers: normalizeAnswers(session.answers) }));
export const saveTokenSessions = (sessions: TokenSessionBinding[]) => writeJson(TOKEN_STORAGE_KEYS.tokenSessions, sessions.map((session) => ({ ...session, answers: normalizeAnswers(session.answers) }))); 

export const expireOldTokens = () => {
  const now = Date.now();
  const tokens = loadTokens();
  let changed = false;
  const next = tokens.map((token) => {
    if ((token.status === 'unused' || token.status === 'active') && new Date(token.expiresAt).getTime() < now) {
      changed = true;
      return { ...token, status: 'expired' as const };
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

export const markTokenActive = (tokenId: string) => updateToken(tokenId, (token) => ({
  ...token,
  status: 'active',
  usedAttempts: Math.min(token.maxAttempts ?? 1, (token.usedAttempts ?? 0) + 1),
  startedAt: token.startedAt || new Date().toISOString(),
}));

export const markTokenCompleted = (tokenId: string, resultId: string) => updateToken(tokenId, (token) => ({
  ...token,
  status: 'completed',
  completedAt: new Date().toISOString(),
  resultId,
}));

export const revokeToken = (tokenId: string) => updateToken(tokenId, (token) => ({ ...token, status: 'revoked' }));

export const resetToken = (tokenId: string) => updateToken(tokenId, (token) => ({
  ...token,
  status: 'unused',
  usedAttempts: 0,
  startedAt: null,
  completedAt: null,
  resultId: null,
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
  };
  saveTokenSessions([tokenSession, ...loadTokenSessions().filter((item) => item.tokenId !== tokenId)]);
  return session;
};

export const validateSessionToken = (session: CurrentSession | null = loadCurrentSession()) => {
  if (!session?.tokenId) return { valid: false, message: 'Silakan masukkan token akses dan unique key terlebih dahulu.', token: null as AccessToken | null };
  const token = getTokenById(session.tokenId);
  if (!token) return { valid: false, message: 'Token tidak ditemukan.', token: null };
  if (token.status === 'completed') return { valid: false, message: 'Token ini sudah digunakan dan tes sudah selesai.', token };
  if (token.status === 'expired') return { valid: false, message: 'Token sudah kedaluwarsa. Hubungi admin.', token };
  if (token.status === 'revoked') return { valid: false, message: 'Token dibatalkan admin.', token };
  if (token.status !== 'active') return { valid: false, message: 'Silakan masukkan token akses dan unique key terlebih dahulu.', token };
  if (session.token !== token.token || session.uniqueKey !== token.uniqueKey) return { valid: false, message: 'Session token tidak cocok.', token };
  return { valid: true, message: '', token };
};

export const touchTokenSession = (session: CurrentSession) => {
  if (!session.tokenId) return;
  const now = new Date().toISOString();
  saveTokenSessions(loadTokenSessions().map((item) => item.tokenId === session.tokenId ? { ...item, participant: session.identity, answers: normalizeAnswers(session.answers), lastSavedAt: now } : item));
};

export const STORAGE_KEYS_FOR_TOKEN_ACCESS = STORAGE_KEYS;
