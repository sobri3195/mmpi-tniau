import { Button, Card, Disclaimer, PrivacyNotice } from '../components/ui';

export const LandingPage = ({ go }: { go: (page: string) => void }) => (
  <div className="mx-auto max-w-6xl px-4 py-12">
    <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_.8fr]">
      <div>
        <span className="rounded-full bg-teal-100 px-4 py-2 text-sm font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-200">SPPG Assessment Suite</span>
        <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 dark:text-white md:text-6xl">Asesmen MMPI SPPG</h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-600 dark:text-slate-300">Aplikasi frontend untuk administrasi asesmen berbasis bank soal dan konfigurasi scoring resmi/berizin yang diimport admin. Tanpa backend, Vercel-ready, dan semua data tersimpan lokal.</p>
        <div className="mt-8 flex flex-wrap gap-3 no-print">
          <Button onClick={() => go('identity')}>Mulai Tes</Button>
          <Button variant="secondary" onClick={() => go('admin')}>Admin</Button>
        </div>
      </div>
      <Card className="space-y-4">
        {['Import bank soal berizin', 'Autosave progres lokal', 'Review profesional wajib'].map((label) => (
          <div key={label} className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-200">✓</span><span className="font-bold">{label}</span>
          </div>
        ))}
      </Card>
    </div>
    <div className="mt-8 grid gap-4 lg:grid-cols-2"><Disclaimer /><PrivacyNotice /></div>
  </div>
);
