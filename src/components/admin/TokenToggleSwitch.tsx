import type { AccessToken } from '../../types';
import { Button } from '../ui';
import { disableToken, enableToken } from '../../utils/tokenAccess';

export const TokenToggleSwitch = ({ token, onChange, toast }: { token: AccessToken; onChange: () => void; toast: (message: string, tone?: 'teal' | 'amber' | 'rose') => void }) => {
  const enabled = token.isEnabled === true && token.status !== 'disabled';
  const toggle = () => {
    if (enabled) {
      const reason = prompt('Alasan menonaktifkan token:', 'Dinonaktifkan petugas ujian') || 'Dinonaktifkan petugas ujian';
      disableToken(token.tokenId, 'admin', reason);
      toast('Token dinonaktifkan dan session peserta dikunci.', 'amber');
      onChange();
      return;
    }
    const updated = enableToken(token.tokenId, 'admin');
    if (!updated) {
      toast('Token revoked/completed/expired tidak dapat diaktifkan kembali tanpa prosedur yang sesuai.', 'rose');
      return;
    }
    toast('Token diaktifkan kembali.', 'teal');
    onChange();
  };
  return <Button variant={enabled ? 'danger' : 'secondary'} onClick={toggle}>{enabled ? 'OFF' : 'ON'}</Button>;
};
