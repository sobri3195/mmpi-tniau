import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Card } from '../ui';
import { validateParticipantAccess, type ParticipantAccessDeniedReason } from '../../utils/tokenValidation';

const redirectPathByReason = (reason: ParticipantAccessDeniedReason) => {
  if (reason === 'token_disabled' || reason === 'paused_token_disabled') return '/token-disabled';
  if (reason === 'token_completed') return '/token-completed';
  if (reason === 'token_expired') return '/token-expired';
  return '/access';
};

export const getParticipantAccessRedirect = (reason: ParticipantAccessDeniedReason) => redirectPathByReason(reason);

export const ParticipantProtectedRoute = ({ children, currentRoute, onRedirect }: { children: ReactNode; currentRoute: string; onRedirect?: (path: string, reason: ParticipantAccessDeniedReason, message: string) => void }) => {
  const validation = validateParticipantAccess({ currentRoute });
  useEffect(() => {
    if (!validation.allowed) onRedirect?.(redirectPathByReason(validation.reason), validation.reason, validation.message);
  }, [validation.allowed, validation.message, validation.reason, onRedirect]);

  if (!validation.allowed) {
    return <div className="mx-auto max-w-xl px-4 py-10"><Card><h1 className="text-2xl font-black">Akses peserta diblokir</h1><p className="mt-3 font-semibold text-slate-600 dark:text-slate-300">{validation.message}</p></Card></div>;
  }
  return <>{children}</>;
};
