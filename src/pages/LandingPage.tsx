import { BrandLogo } from '../components/BrandLogo';
import { Button, Card, Disclaimer, PrivacyNotice } from '../components/ui';

export const LandingPage = ({ go, questionsCount, hasScoringConfig }: { go: (page: string) => void; questionsCount: number; hasScoringConfig: boolean }) => (
  <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
    <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_.8fr]">
      <div>
        <div className="flex items-center gap-4">
          <BrandLogo className="h-20 w-20 sm:h-24 sm:w-24" />
          <span className="rounded-full bg-teal-100 px-4 py-2 text-sm font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-200">Kesehatan Jiwa TNI Angkatan Udara</span>
        </div>
        <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl md:text-6xl">MMPI (Minnesota Multiphasic Personality Inventory)</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
          Tes ini digunakan untuk administrasi asesmen melalui bank soal resmi/berizin yang diimpor admin. Sistem tidak memuat kunci skoring MMPI asli.
        </p>
        <div className="mt-6 space-y-3">
          {!questionsCount && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">Bank soal belum tersedia. Admin harus mengimpor bank soal resmi/berizin sebelum tes dapat berjalan.</div>}
          {!hasScoringConfig && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">Tes dapat dikerjakan, tetapi hasil belum bisa dihitung sebelum admin mengimpor konfigurasi scoring.</div>}
        </div>
        <div className="mt-8 grid gap-3 no-print sm:flex sm:flex-wrap">
          <Button onClick={() => go('identity')}>Mulai tes</Button>
          <Button variant="secondary" onClick={() => go('admin')}>Admin</Button>
        </div>
      </div>
      <Card className="space-y-4">
        <h2 className="text-xl font-black">Prosedur</h2>
        {[
          'Responden mengisi pertanyaan sesuai kondisi yang dialami.',
          'Estimasi waktu pengisian sekitar 60-90 menit, bergantung bank soal yang digunakan.',
          'Tidak ada jawaban benar atau salah; jawaban diberikan berdasarkan pengalaman pribadi.',
        ].map((label) => (
          <div key={label} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3 sm:gap-4 sm:p-4 dark:bg-slate-800">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-200">✓</span><span className="font-bold">{label}</span>
          </div>
        ))}
      </Card>
    </div>
    <div className="mt-8 grid gap-4 lg:grid-cols-2"><Disclaimer /><PrivacyNotice /></div>
  </div>
);
