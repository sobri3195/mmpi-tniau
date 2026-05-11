import { useState } from 'react';
import { Button, Input } from '../ui';
import { AlertBox } from '../admin/AdminCommon';
import { loginUser } from '../../utils/session';

export const LoginForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      loginUser(username, password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal.');
    }
  };
  return <form className="space-y-4" onSubmit={submit}>
    <label className="text-sm font-bold">Username<Input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" /></label>
    <label className="text-sm font-bold">Password/PIN<Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></label>
    {error && <AlertBox tone="rose">{error}</AlertBox>}
    <Button type="submit" className="w-full">Masuk Admin</Button>
  </form>;
};
