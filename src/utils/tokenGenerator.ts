import type { AccessToken } from '../types';
import { loadTokens, saveTokens } from './tokenAccess';

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const randomBlock = (length = 4) => Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');

export const generateToken = (prefix = 'TNI-AU') => `${prefix.toUpperCase().trim() || 'TNI-AU'}-${randomBlock()}-${randomBlock()}`;

export const generateUniqueKey = (prefix = 'PESERTA-2026', index = 1) => `${prefix.toUpperCase().trim() || 'PESERTA-2026'}-${String(index).padStart(4, '0')}`;

export interface CreateAccessTokenPayload {
  token?: string;
  uniqueKey?: string;
  participantName?: string;
  participantNumber?: string;
  unit?: string;
  expiresAt?: string;
  maxAttempts?: number;
  notes?: string;
}

export interface BulkCreateTokenOptions extends CreateAccessTokenPayload {
  tokenPrefix?: string;
  uniqueKeyPrefix?: string;
  expiresInDays?: number;
  startIndex?: number;
}

const defaultExpiresAt = (days = 7) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
};

export const createAccessToken = (payload: CreateAccessTokenPayload = {}): AccessToken => ({
  tokenId: crypto.randomUUID(),
  token: (payload.token || generateToken('TNI-AU')).toUpperCase().trim(),
  uniqueKey: (payload.uniqueKey || generateUniqueKey('PESERTA-2026', Date.now() % 10000)).toUpperCase().trim(),
  participantName: payload.participantName?.trim() || '',
  participantNumber: payload.participantNumber?.trim() || '',
  unit: payload.unit?.trim() || '',
  createdAt: new Date().toISOString(),
  expiresAt: payload.expiresAt || defaultExpiresAt(),
  status: 'unused',
  maxAttempts: Math.max(1, Number(payload.maxAttempts) || 1),
  usedAttempts: 0,
  startedAt: null,
  completedAt: null,
  resultId: null,
  notes: payload.notes?.trim() || '',
});

export const bulkCreateTokens = (count: number, options: BulkCreateTokenOptions = {}) => {
  const existing = loadTokens();
  const tokenValues = new Set(existing.map((item) => item.token.toUpperCase()));
  const uniqueKeys = new Set(existing.map((item) => item.uniqueKey.toUpperCase()));
  const created: AccessToken[] = [];
  const expiresAt = options.expiresAt || defaultExpiresAt(options.expiresInDays || 7);
  const startIndex = options.startIndex || uniqueKeys.size + 1;

  for (let i = 0; i < count; i += 1) {
    let token = '';
    do token = generateToken(options.tokenPrefix || 'TNI-AU'); while (tokenValues.has(token));
    tokenValues.add(token);

    let uniqueKey = generateUniqueKey(options.uniqueKeyPrefix || 'PESERTA-2026', startIndex + i);
    let bump = startIndex + i;
    while (uniqueKeys.has(uniqueKey)) {
      bump += 1;
      uniqueKey = generateUniqueKey(options.uniqueKeyPrefix || 'PESERTA-2026', bump);
    }
    uniqueKeys.add(uniqueKey);

    created.push(createAccessToken({ ...options, token, uniqueKey, expiresAt }));
  }
  saveTokens([...created, ...existing]);
  return created;
};

export const ensureUniqueGeneratedToken = (prefix: string) => {
  const existing = new Set(loadTokens().map((item) => item.token.toUpperCase()));
  let token = generateToken(prefix);
  while (existing.has(token)) token = generateToken(prefix);
  return token;
};
