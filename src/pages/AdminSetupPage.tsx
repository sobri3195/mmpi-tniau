import { Card } from '../components/ui';
import { BrandLogo } from '../components/BrandLogo';
import { SecurityNotice } from '../components/auth/SecurityNotice';
import { AdminSetupForm } from '../components/auth/AdminSetupForm';

export const AdminSetupPage = ({ onDone }: { onDone: () => void }) => (
  <div className="mx-auto flex min-h-[calc(100vh-88px)] max-w-xl items-center px-4 py-10">
    <Card className="w-full">
      <div className="flex items-center gap-3"><BrandLogo className="h-12 w-12" /><div><p className="text-sm font-bold uppercase tracking-wide text-teal-700">Setup Awal</p><h1 className="text-2xl font-black">Setup Superadmin Pertama</h1></div></div>
      <div className="mt-4"><SecurityNotice /></div>
      <AdminSetupForm onSuccess={onDone} />
    </Card>
  </div>
);
