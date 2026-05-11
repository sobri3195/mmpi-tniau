import type { AssessmentResult, ScoringConfig } from '../types';
import { ScoreCharts } from '../components/Charts';
import { InterpretationReport } from '../components/InterpretationReport';
import { ScoreTable } from '../components/ScoreTable';
import { Badge, Button, Card } from '../components/ui';
import { exportResultJson, exportResultsCsv, printReport } from '../utils/export';
import { generateSpecialistInterpretation } from '../utils/interpretation';

export const ResultsPage = ({ result, scoringConfig, goHome }: { result: AssessmentResult; scoringConfig?: ScoringConfig | null; goHome: () => void }) => {
  const submittedAt = new Date(result.submittedAt);
  const submittedDateTime = submittedAt.toLocaleString('id-ID');
  const report = generateSpecialistInterpretation(result, scoringConfig);
  const validityTone = result.validityStatus?.status === 'valid' ? 'teal' : result.validityStatus?.status === 'invalid' ? 'rose' : 'amber';
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      {report.isDemo && <Card className="mb-6 border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"><h2 className="text-xl font-black">Konfigurasi yang digunakan masih demo/placeholder.</h2><p className="mt-2">Laporan ini tidak valid untuk interpretasi klinis atau personel. Jangan tampilkan “Interpretasi Spesialis” sampai admin mengimpor konfigurasi resmi/berizin.</p></Card>}
      <Card className="mb-6">
        <div className="flex flex-wrap justify-between gap-4"><div><p className="text-sm font-bold text-teal-600">Kesehatan Jiwa TNI Angkatan Udara</p><h1 className="text-2xl font-black sm:text-3xl">Laporan Hasil Asesmen MMPI-2 TNI AU</h1><p className="text-slate-500">Kesehatan Jiwa TNI Angkatan Udara</p></div><div className="flex flex-col items-start gap-2 sm:items-end"><Badge tone={result.status === 'Perlu Review' ? 'amber' : 'teal'}>{result.status}</Badge><Badge tone={validityTone}>{result.validityStatus?.label ?? 'Validitas belum dinilai'}</Badge></div></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          <Info label="Nama" value={result.identity.name} /><Info label="Nomor peserta" value={result.identity.participantNumber || '-'} /><Info label="Tanggal asesmen" value={result.identity.assessmentDate || submittedAt.toLocaleDateString('id-ID')} />
          <Info label="Tanggal lahir" value={result.identity.dateOfBirth || '-'} /><Info label="Usia" value={result.identity.age || '-'} /><Info label="Jenis kelamin" value={result.identity.gender || '-'} />
          <Info label="Status perkawinan" value={result.identity.maritalStatus || '-'} /><Info label="Pendidikan" value={result.identity.education || '-'} /><Info label="Pekerjaan" value={result.identity.occupation || '-'} />
          <Info label="Asal satker" value={result.identity.originWorkUnit || '-'} /><Info label="Kesatuan" value={result.identity.unit || '-'} /><Info label="Tanggal submit" value={submittedDateTime} />
          <Info label="Total soal" value={String(result.totalQuestions)} /><Info label="Total dijawab" value={String(result.answeredCount)} /><Info label="Durasi pengerjaan" value={result.durationLabel ?? '-'} />
          <Info label="Status validitas" value={result.validityStatus?.label ?? 'Belum tersedia'} />
        </div>
        {result.validityStatus?.reasons?.length ? <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-800"><p className="font-bold">Catatan validitas</p><ul className="mt-2 list-disc pl-5">{result.validityStatus.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></div> : null}
        <div className="mt-6 grid gap-3 no-print sm:flex sm:flex-wrap"><Button onClick={() => exportResultJson(result)}>Export JSON</Button><Button variant="ghost" onClick={() => exportResultsCsv([result])}>Export CSV</Button><Button variant="secondary" onClick={printReport}>Cetak / PDF</Button><Button variant="ghost" onClick={goHome}>Beranda</Button></div>
      </Card>
      <Card className="mb-6"><h2 className="mb-3 text-xl font-black">Executive Summary</h2><p className="text-sm leading-6">{report.executiveSummary}</p><div className="mt-3"><Badge tone={report.reviewStatus === 'Dapat ditelaah' ? 'teal' : report.reviewStatus === 'Perlu review/retest' ? 'rose' : 'amber'}>{report.reviewStatus}</Badge></div></Card>
      <Card className="mb-6"><ScoreCharts scores={result.scores} /></Card>
      <Card className="mb-6"><h2 className="mb-4 text-xl font-black">Tabel Skor dan Interpretasi</h2><ScoreTable scores={result.scores} /></Card>
      <Card className="mb-6"><InterpretationReport result={result} scoringConfig={scoringConfig} /></Card>
    </div>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => <div className="rounded-2xl bg-slate-50 p-3 sm:p-4 dark:bg-slate-800"><p className="text-xs uppercase text-slate-500">{label}</p><p className="font-bold">{value}</p></div>;
