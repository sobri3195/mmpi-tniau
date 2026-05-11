import { useState } from 'react';
import { Button, Card, Input } from '../components/ui';
import { ADMIN_AUTH_KEY, ADMIN_PIN_KEY } from '../utils/adminStorage';
import { AlertBox } from '../components/admin/AdminCommon';

export const AdminLogin = ({ onAuthenticated }: { onAuthenticated: () => void }) => {
  const existingPin = localStorage.getItem(ADMIN_PIN_KEY);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const firstRun = !existingPin;
  const submit = () => {
    setError('');
    if (firstRun) {
      if (pin.length < 4) { setError('PIN minimal 4 digit/karakter.'); return; }
      if (pin !== confirmPin) { setError('Konfirmasi PIN tidak sama.'); return; }
      localStorage.setItem(ADMIN_PIN_KEY, pin);
      localStorage.setItem(ADMIN_AUTH_KEY, 'true');
      onAuthenticated();
      return;
    }
    if (pin !== existingPin) { setError('PIN admin salah.'); return; }
    localStorage.setItem(ADMIN_AUTH_KEY, 'true');
    onAuthenticated();
  };

  return <div className="mx-auto max-w-xl px-4 py-10"><Card><p className="text-sm font-bold uppercase tracking-wide text-teal-700">Keamanan Admin</p><h1 className="mt-2 text-2xl font-black">{firstRun ? 'Buat PIN Admin' : 'Login Admin'}</h1><div className="mt-6 space-y-4"><label className="text-sm font-bold">PIN Admin<Input type="password" value={pin} onChange={(e) => setPin(e.target.value)} /></label>{firstRun && <label className="text-sm font-bold">Konfirmasi PIN<Input type="password" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} /></label>}{error && <AlertBox tone="rose">{error}</AlertBox>}<Button onClick={submit}>{firstRun ? 'Simpan PIN dan Masuk' : 'Masuk Admin'}</Button></div></Card></div>;
};
