import { useState } from 'react';
import { Button, Card, Input } from '../components/ui';
import { AlertBox } from '../components/admin/AdminCommon';
import { SecurityNotice } from '../components/auth/SecurityNotice';
import { initializeFirstSuperadmin } from '../utils/userStorage';

export const AdminSetupPage = ({ onDone }: { onDone: () => void }) => {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('superadmin');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const submit = (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    if (password !== confirm) { setError('Konfirmasi password/PIN tidak sama.'); return; }
    try { initializeFirstSuperadmin({ displayName, username, password }); onDone(); } catch (err) { setError(err instanceof Error ? err.message : 'Setup gagal.'); }
  };
  return <div className="mx-auto max-w-xl px-4 py-10"><Card><p className="text-sm font-bold uppercase tracking-wide text-teal-700">Setup Awal</p><h1 className="mt-2 text-2xl font-black">Buat Superadmin Pertama</h1><div className="mt-4"><SecurityNotice /></div><form className="mt-6 space-y-4" onSubmit={submit}><label className="text-sm font-bold">Nama<Input required value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></label><label className="text-sm font-bold">Username<Input required value={username} onChange={(e) => setUsername(e.target.value)} /></label><label className="text-sm font-bold">Password/PIN<Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label><label className="text-sm font-bold">Konfirmasi password/PIN<Input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label>{error && <AlertBox tone="rose">{error}</AlertBox>}<Button type="submit" className="w-full">Simpan Superadmin</Button></form></Card></div>;
};
