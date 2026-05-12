import type { ParticipantAccessDeniedReason } from '../../utils/tokenValidation';

export const getParticipantAccessRedirect = (reason: ParticipantAccessDeniedReason) => {
  if (reason === 'token_disabled' || reason === 'paused_token_disabled') return '/token-disabled';
  if (reason === 'token_completed') return '/token-completed';
  if (reason === 'token_expired') return '/token-expired';
  return '/access';
};
