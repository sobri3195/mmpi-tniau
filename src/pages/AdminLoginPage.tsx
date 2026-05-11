import { Card } from '../components/ui';
import { LoginForm } from '../components/auth/LoginForm';
import { SecurityNotice } from '../components/auth/SecurityNotice';

export const AdminLoginPage = ({ onAuthenticated }: { onAuthenticated: () => void }) => (
  <div className="mx-auto max-w-xl px-4 py-10"><Card><p className="text-sm font-bold uppercase tracking-wide text-teal-700">Login Admin</p><h1 className="mt-2 text-2xl font-black">Masuk Multiakses</h1><div className="mt-4"><SecurityNotice /></div><div className="mt-6"><LoginForm onSuccess={onAuthenticated} /></div></Card></div>
);
