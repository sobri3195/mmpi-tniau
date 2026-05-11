import { Button, Card, Disclaimer } from '../components/ui';

export const InstructionsPage = ({ onStart }: { onStart: () => void }) => (
  <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
    <Card>
      <h1 className="text-2xl font-black sm:text-3xl">Instruksi Pengerjaan</h1>
      <ol className="mt-6 list-decimal space-y-3 pl-5 text-slate-700 dark:text-slate-200">
        <li>Jawab setiap item sesuai kondisi diri Anda secara jujur.</li>
        <li>Tidak ada jawaban benar atau salah secara umum; pilihan mengikuti format bank soal: Benar/Salah atau Ya/Tidak.</li>
        <li>Progres akan tersimpan otomatis di localStorage sehingga dapat dilanjutkan pada browser yang sama.</li>
        <li>Estimasi waktu pengisian sekitar 60-90 menit, bergantung jumlah item pada bank soal resmi yang diimport admin.</li>
        <li>Pastikan seluruh soal terjawab sebelum menekan submit.</li>
      </ol>
      <div className="mt-6"><Disclaimer /></div>
      <Button className="mt-6 w-full no-print sm:w-auto" onClick={onStart}>Mulai Mengerjakan</Button>
    </Card>
  </div>
);
