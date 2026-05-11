import { bindTokenToSession, getTokenByTokenValue, markTokenActive } from './tokenAccess';

export const validateTokenAccess = (tokenValue: string, uniqueKeyValue: string) => {
  const token = getTokenByTokenValue(tokenValue);
  if (!token) return { valid: false, message: 'Token tidak ditemukan.', token: null, session: null };
  if (token.uniqueKey.toUpperCase() !== uniqueKeyValue.trim().toUpperCase()) return { valid: false, message: 'Unique key tidak sesuai.', token, session: null };
  if (token.status === 'expired' || new Date(token.expiresAt).getTime() < Date.now()) return { valid: false, message: 'Token sudah expired.', token, session: null };
  if (token.status === 'revoked') return { valid: false, message: 'Token dibatalkan admin.', token, session: null };
  if (token.status === 'completed') return { valid: false, message: 'Token sudah selesai.', token, session: null };
  if (token.status === 'active') return { valid: false, message: 'Token sudah digunakan.', token, session: null };
  if (token.usedAttempts >= token.maxAttempts) return { valid: false, message: 'Token sudah melebihi batas percobaan.', token, session: null };
  markTokenActive(token.tokenId);
  const session = bindTokenToSession(token.tokenId);
  return { valid: Boolean(session), message: session ? '' : 'Token tidak ditemukan.', token, session };
};
