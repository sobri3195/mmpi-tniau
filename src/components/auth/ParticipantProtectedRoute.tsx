import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Card } from '../ui';
import { validateParticipantAccess, type ParticipantAccessDeniedReason } from '../../utils/tokenValidation';
import { getParticipantAccessRedirect } from './participantAccessRedirect';

export const ParticipantProtectedRoute = ({ children, currentRoute, onRedirect }: { children: ReactNode; currentRoute: string; onRedirect?: (path: string, reason: ParticipantAccessDeniedReason, message: string) => void }) => {
  const validation = validateParticipantAccess({ currentRoute });
  useEffect(() => {
    if (!validation.allowed) onRedirect?.(getParticipantAccessRedirect(validation.reason), validation.reason, validation.message);
  }, [validation.allowed, validation.message, validation.reason, onRedirect]);

  if (!validation.allowed) {
    return <div className="mx-auto max-w-xl px-4 py-10"><Card><h1 className="text-2xl font-black">Akses peserta diblokir</h1><p className="mt-3 font-semibold text-slate-600 dark:text-slate-300">{validation.message}</p></Card></div>;
  }
  return <>{children}</>;
};
