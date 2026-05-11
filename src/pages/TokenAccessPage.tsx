import { useState } from 'react';
import { Button, Card, Input } from '../components/ui';
import { validateTokenAccess } from '../utils/tokenValidation';

export const TokenAccessPage = ({ reason, onVerified }: { reason?: string; onVerified: () => void }) => {
  const [token, setToken] = useState('');
  const [uniqueKey, setUniqueKey] = useState('');
  const [message, setMessage] = useState(reason || '');
  const verify = () => {
    const result = validateTokenAccess(token, uniqueKey);
    if (!result.valid) {
      setMessage(result.message);
      return;
    }
    onVerified();
  };
  return <div className="mx-auto max-w-xl px-4 py-10">
    <Card>
      <p className="text-sm font-bold uppercase tracking-wide text-teal-700">Kesehatan Jiwa TNI Angkatan Udara</p>
      <h1 className="mt-2 text-3xl font-black">Masuk Tes MMPI TNI AU</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">Masukkan token akses dan unique key peserta yang diberikan admin. Token hanya disimpan di perangkat ini dan tidak dimasukkan ke URL.</p>
      <div className="mt-6 grid gap-4">
        <label>Token akses<Input autoFocus value={token} placeholder="TNI-AU-AB12-CD34" onChange={(e) => setToken(e.target.value.toUpperCase())} /></label>
        <label>Unique key<Input value={uniqueKey} placeholder="PESERTA-2026-0001" onChange={(e) => setUniqueKey(e.target.value.toUpperCase())} /></label>
      </div>
      {message && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">{message}</div>}
      <Button className="mt-6 w-full" disabled={!token || !uniqueKey} onClick={verify}>Verifikasi Token</Button>
    </Card>
  </div>;
};
