import { useEffect, useState } from 'react';
import { Button, Card, Input } from '../components/ui';
import { validateTokenAccess } from '../utils/tokenValidation';
import { cleanupInvalidParticipantSession } from '../utils/storage';

export const TokenAccessPage = ({ reason, onVerified }: { reason?: string; onVerified: () => void }) => {
  const [token, setToken] = useState('');
  const [uniqueKey, setUniqueKey] = useState('');
  const [message, setMessage] = useState(reason || '');

  useEffect(() => {
    cleanupInvalidParticipantSession();
  }, []);
  const tokenReady = token.trim().length > 0;
  const uniqueKeyReady = uniqueKey.trim().length > 0;
  const verify = () => {
    const trimmedToken = token.trim();
    const trimmedUniqueKey = uniqueKey.trim();
    const result = validateTokenAccess(trimmedToken, trimmedUniqueKey);
    if (!result.valid) {
      setMessage(result.message);
      return;
    }
    onVerified();
  };
  return <div className="mx-auto max-w-xl px-4 py-10">
    <Card>
      <h1 className="text-3xl font-black">Masuk Tes MMPI TNI AU</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">Masukkan token akses dan kunci unik peserta yang diberikan petugas. Token hanya disimpan di perangkat ini dan tidak dimasukkan ke URL.</p>
      <div className="mt-6 grid gap-4">
        <label>Token akses<Input autoFocus value={token} placeholder="Masukkan token akses" onChange={(e) => setToken(e.target.value.toUpperCase())} /></label>
        <label>Kunci unik<Input value={uniqueKey} placeholder="Masukkan kunci unik" onChange={(e) => setUniqueKey(e.target.value.toUpperCase())} /></label>
      </div>
      {message && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">{message}</div>}
      <Button className="mt-6 w-full" disabled={!tokenReady || !uniqueKeyReady} onClick={verify}>Verifikasi token</Button>
    </Card>
  </div>;
};
