import { Button, Card, Disclaimer } from '../components/ui';

export const InstructionsPage = ({ onStart, questionsCount }: { onStart: () => void; questionsCount: number }) => (
  <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
    <Card>
      <h1 className="text-3xl font-black sm:text-4xl">Instruksi pengerjaan</h1>
      <div className="mt-5 space-y-3">
        {!questionsCount && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-lg font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">Bank soal belum tersedia. Hubungi admin.</div>}
      </div>
      <ol className="mt-6 list-decimal space-y-4 pl-6 text-lg leading-relaxed text-slate-800 dark:text-slate-100">
        <li>Jawab setiap butir sesuai kondisi diri Anda secara jujur.</li>
        <li>Tidak ada jawaban benar atau salah secara umum; peserta hanya memilih tombol <strong className="text-2xl">“+”</strong> atau <strong className="text-2xl">“-”</strong>.</li>
        <li>Tombol <strong className="text-2xl">“+”</strong> dan <strong className="text-2xl">“-”</strong> akan tampil besar selama tes. Label <strong>“Dipilih”</strong> muncul pada jawaban yang sudah dipilih.</li>
        <li>Gunakan menu <strong>Ukuran Teks</strong> di halaman tes untuk memilih Normal, Besar, atau Sangat Besar sesuai kenyamanan membaca.</li>
        <li>Progres akan tersimpan otomatis sehingga dapat dilanjutkan pada browser yang sama.</li>
        <li>Estimasi waktu pengisian sekitar 60-90 menit, bergantung jumlah butir pada bank soal resmi yang diimpor admin.</li>
        <li>Pastikan seluruh soal terjawab sebelum menekan tombol kirim hasil.</li>
      </ol>
      <div className="mt-6"><Disclaimer /></div>
      <Button className="mt-6 min-h-14 w-full text-lg no-print sm:w-auto" onClick={onStart}>Mulai mengerjakan</Button>
    </Card>
  </div>
);
