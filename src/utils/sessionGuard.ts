import type { CurrentSession } from '../types';
import { saveCurrentSession } from './storage';
import { validateParticipantAccess } from './tokenValidation';

export const guardParticipantSession = (session?: CurrentSession | null, currentRoute = '') => validateParticipantAccess({ session, currentRoute });

export const pauseSessionForDisabledToken = (session: CurrentSession) => {
  const now = new Date().toISOString();
  const paused = { ...session, sessionStatus: 'paused_token_disabled' as const, status: 'paused_token_disabled' as const, updatedAt: now, lastSavedAt: now };
  saveCurrentSession(paused);
  return paused;
};
