import { useEffect } from 'react';
import { BrandLogo } from '../components/BrandLogo';
import { Button, Card } from '../components/ui';
import { cleanupInvalidParticipantSession } from '../utils/storage';

const REDIRECT_URL = 'https://mmpi.puskesau.com';
const REDIRECT_DELAY_MS = 1200;

export const LandingPage = ({ questionsCount: _questionsCount }: { go: (page: string) => void; questionsCount: number }) => {
  useEffect(() => {
    cleanupInvalidParticipantSession();
    const redirectTimer = window.setTimeout(() => {
      window.location.replace(REDIRECT_URL);
    }, REDIRECT_DELAY_MS);

    return () => window.clearTimeout(redirectTimer);
  }, []);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-88px)] max-w-3xl items-center px-4 py-10 sm:py-14">
      <Card className="w-full overflow-hidden text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-teal-50 dark:bg-teal-950/60">
          <BrandLogo className="h-20 w-20" />
        </div>
        <p className="mt-6 text-sm font-bold uppercase tracking-[0.28em] text-teal-700 dark:text-teal-300">MMPI TNI AU</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">Mengalihkan ke alamat aplikasi terbaru</h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
          Halaman index ini akan otomatis menuju ke <span className="font-bold text-slate-900 dark:text-white">mmpi.puskesau.com</span>. Jika pengalihan tidak berjalan, gunakan tombol di bawah.
        </p>
        <div className="mt-8 grid gap-3 sm:flex sm:justify-center">
          <Button onClick={() => window.location.replace(REDIRECT_URL)}>Buka MMPI Puskesau</Button>
          <a className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" href={REDIRECT_URL} rel="noreferrer">
            Link langsung
          </a>
        </div>
      </Card>
    </div>
  );
};
