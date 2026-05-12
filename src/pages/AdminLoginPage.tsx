import { Card } from '../components/ui';
import { BrandLogo } from '../components/BrandLogo';
import { SecurityNotice } from '../components/auth/SecurityNotice';
import { AdminLoginForm } from '../components/auth/AdminLoginForm';

export const AdminLoginPage = ({ onAuthenticated, message }: { onAuthenticated: (path?: string) => void; message?: string }) => {
  const sessionMessage = message || sessionStorage.getItem('sppg_mmpi2_session_message') || '';
  return (
  <div className="mx-auto flex min-h-[calc(100vh-88px)] max-w-xl items-center px-4 py-10">
    <Card className="w-full">
      <div className="flex items-center gap-3"><BrandLogo className="h-12 w-12" /><div><p className="text-sm font-bold uppercase tracking-wide text-teal-700">Kesehatan Jiwa TNI Angkatan Udara</p><h1 className="text-2xl font-black">Login Admin MMPI TNI AU</h1></div></div>
      {sessionMessage && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">{sessionMessage}</div>}
      <div className="mt-4"><SecurityNotice /></div>
      <div className="mt-6"><AdminLoginForm onSuccess={(path) => { sessionStorage.removeItem('sppg_mmpi2_session_message'); onAuthenticated(path); }} /></div>
      <a className="mt-5 block text-center text-xs font-bold text-teal-700 hover:underline" href="/access" onClick={(event) => { event.preventDefault(); window.history.replaceState(null, '', '/access'); window.dispatchEvent(new PopStateEvent('popstate')); }}>Kembali ke halaman peserta</a>
    </Card>
  </div>
  );
};
