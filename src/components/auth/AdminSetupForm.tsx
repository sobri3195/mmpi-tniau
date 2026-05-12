import { useState } from 'react';
import { Button, Input } from '../ui';
import { AlertBox } from '../admin/AdminCommon';
import { initializeFirstSuperadmin } from '../../utils/userStorage';

export const AdminSetupForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('superadmin');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (username.trim().length < 4) { setError('Username minimal 4 karakter.'); return; }
    if (password.length < 8) { setError('Password minimal 8 karakter.'); return; }
    if (password !== confirm) { setError('Password dan konfirmasi harus sama.'); return; }
    if (pin && !/^\d{4,}$/.test(pin)) { setError('PIN jika diisi minimal 4 digit.'); return; }
    if (pin !== pinConfirm) { setError('PIN dan konfirmasi PIN harus sama.'); return; }
    setLoading(true);
    try { await initializeFirstSuperadmin({ displayName, username, password, pin }); onSuccess(); } catch (err) { setError(err instanceof Error ? err.message : 'Setup gagal.'); } finally { setLoading(false); }
  };
  return <form className="mt-6 space-y-4" onSubmit={submit}>
    <label className="text-sm font-bold">Nama lengkap<Input required value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="name" /></label>
    <label className="text-sm font-bold">Username<Input required value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" /></label>
    <label className="text-sm font-bold">Password<Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /></label>
    <label className="text-sm font-bold">Konfirmasi password<Input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" /></label>
    <label className="text-sm font-bold">PIN opsional<Input inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} /></label>
    <label className="text-sm font-bold">Konfirmasi PIN opsional<Input inputMode="numeric" value={pinConfirm} onChange={(e) => setPinConfirm(e.target.value)} /></label>
    {error && <AlertBox tone="rose">{error}</AlertBox>}
    <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan Superadmin'}</Button>
  </form>;
};
