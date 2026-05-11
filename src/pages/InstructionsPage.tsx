import { Button, Card, Disclaimer } from '../components/ui';

export const InstructionsPage = ({ onStart, questionsCount, hasScoringConfig }: { onStart: () => void; questionsCount: number; hasScoringConfig: boolean }) => (
  <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
    <Card>
      <h1 className="text-2xl font-black sm:text-3xl">Instruksi pengerjaan</h1>
      <div className="mt-5 space-y-3">
        {!questionsCount && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">Bank soal belum tersedia. Hubungi admin.</div>}
        {!hasScoringConfig && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">Tes dapat dikerjakan, tetapi hasil belum bisa dihitung sebelum admin mengimpor konfigurasi scoring.</div>}
      </div>
      <ol className="mt-6 list-decimal space-y-3 pl-5 text-slate-700 dark:text-slate-200">
        <li>Jawab setiap butir sesuai kondisi diri Anda secara jujur.</li>
        <li>Tidak ada jawaban benar atau salah secara umum; peserta hanya memilih tombol “+” atau “-”.</li>
        <li>Progres akan tersimpan otomatis sehingga dapat dilanjutkan pada browser yang sama.</li>
        <li>Estimasi waktu pengisian sekitar 60-90 menit, bergantung jumlah butir pada bank soal resmi yang diimpor admin.</li>
        <li>Pastikan seluruh soal terjawab sebelum menekan tombol kirim hasil.</li>
      </ol>
      <div className="mt-6"><Disclaimer /></div>
      <Button className="mt-6 w-full no-print sm:w-auto" onClick={onStart}>Mulai mengerjakan</Button>
    </Card>
  </div>
);
