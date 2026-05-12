import { Button, Card } from '../components/ui';

export const TokenDisabledPage = ({ goAccess }: { goAccess: () => void }) => (
  <div className="mx-auto max-w-xl px-4 py-10">
    <Card>
      <p className="text-sm font-bold uppercase tracking-wide text-rose-700">Akses peserta terkunci</p>
      <h1 className="mt-2 text-3xl font-black">Token Tidak Aktif</h1>
      <p className="mt-4 leading-7 text-slate-700 dark:text-slate-200">Token akses Anda sedang dinonaktifkan oleh admin/petugas ujian. Anda tidak dapat melanjutkan tes sampai token diaktifkan kembali.</p>
      <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
        <Button onClick={goAccess}>Kembali ke Halaman Akses</Button>
        <Button variant="secondary" onClick={() => window.location.href = 'mailto:petugas@example.com?subject=Token%20Tidak%20Aktif'}>Hubungi Petugas</Button>
      </div>
    </Card>
  </div>
);
