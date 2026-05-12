import { useState } from 'react';
import { Button, Input } from '../ui';
import { AlertBox } from '../admin/AdminCommon';
import { loginUser } from '../../utils/session';
import type { AdminRole } from '../../utils/roles';

const redirectForRole = (role: AdminRole) => role === 'tester' ? '/admin/tokens' : role === 'specialist' ? '/admin/review' : '/admin/dashboard';

export const AdminLoginForm = ({ onSuccess }: { onSuccess: (path: string) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const session = await loginUser(username, password);
      onSuccess(redirectForRole(session.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Username atau password salah.');
    } finally {
      setLoading(false);
    }
  };
  return <form className="space-y-4" onSubmit={submit}>
    <label className="text-sm font-bold">Username<Input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" /></label>
    <label className="text-sm font-bold">Password / PIN
      <div className="mt-1 flex gap-2"><Input className="mt-0" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /><Button type="button" variant="ghost" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Sembunyikan' : 'Tampilkan'}</Button></div>
    </label>
    {error && <AlertBox tone="rose">{error}</AlertBox>}
    <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Memeriksa...' : 'Login'}</Button>
  </form>;
};
