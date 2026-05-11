import type { AssessmentResult } from '../types';
import { ScoreCharts } from '../components/Charts';
import { InterpretationReport } from '../components/InterpretationReport';
import { ScoreTable } from '../components/ScoreTable';
import { Badge, Button, Card } from '../components/ui';
import { exportResultJson, exportResultsCsv, printReport } from '../utils/export';

export const ResultsPage = ({ result, goHome }: { result: AssessmentResult; goHome: () => void }) => {
  const submittedAt = new Date(result.submittedAt);
  const submittedDateTime = submittedAt.toLocaleString('id-ID');
  const finishTime = submittedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
    <Card className="mb-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div><p className="text-sm font-bold text-teal-600">Kesehatan Jiwa TNI Angkatan Udara</p><h1 className="text-2xl font-black sm:text-3xl">Laporan Hasil Asesmen</h1><p className="text-slate-500">Submit: {submittedDateTime}</p></div>
        <Badge tone={result.status === 'Perlu Review' ? 'amber' : 'teal'}>{result.status}</Badge>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        <Info label="Nama" value={result.identity.name} /><Info label="Tanggal lahir" value={result.identity.dateOfBirth || '-'} /><Info label="Usia" value={result.identity.age} />
        <Info label="Jenis kelamin" value={result.identity.gender} /><Info label="Status perkawinan" value={result.identity.maritalStatus || '-'} /><Info label="Pendidikan" value={result.identity.education || '-'} />
        <Info label="Pekerjaan" value={result.identity.occupation || '-'} /><Info label="Asal Satker" value={result.identity.originWorkUnit || '-'} /><Info label="Kesatuan" value={result.identity.unit} />
        <Info label="Soal dijawab" value={`${result.answeredCount}/${result.totalQuestions}`} />
        <Info label="Waktu selesai" value={finishTime} />
      </div>
      <div className="mt-6 grid gap-3 no-print sm:flex sm:flex-wrap"><Button onClick={() => exportResultJson(result)}>Export JSON</Button><Button variant="ghost" onClick={() => exportResultsCsv([result])}>Export CSV</Button><Button variant="secondary" onClick={printReport}>Cetak / PDF</Button><Button variant="ghost" onClick={goHome}>Beranda</Button></div>
    </Card>
    <Card className="mb-6"><ScoreCharts scores={result.scores} /></Card>
    <Card className="mb-6"><h2 className="mb-4 text-xl font-black">Tabel Skor dan Interpretasi</h2><ScoreTable scores={result.scores} /></Card>
    <Card className="mb-6"><InterpretationReport scores={result.scores} /></Card>
    </div>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => <div className="rounded-2xl bg-slate-50 p-3 sm:p-4 dark:bg-slate-800"><p className="text-xs uppercase text-slate-500">{label}</p><p className="font-bold">{value}</p></div>;
