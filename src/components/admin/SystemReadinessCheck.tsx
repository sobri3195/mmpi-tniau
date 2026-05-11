import type { Question, ScoringConfig } from '../../types';
import type { AdminReportSettings } from '../../utils/adminStorage';
import { clinicalInterpretationReady, isDemoLikeConfig, validateScoringConfigAdmin } from '../../utils/configValidation';
import { Badge, Card } from '../ui';

const StatusRow = ({ title, ready, partial, notes }: { title: string; ready: boolean; partial?: boolean; notes: string[] }) => <div className={`rounded-2xl border p-4 ${ready ? 'border-teal-200 bg-teal-50 dark:border-teal-800 dark:bg-teal-950' : partial ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950' : 'border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950'}`}><div className="flex items-start justify-between gap-3"><h3 className="font-black">{title}</h3><Badge tone={ready ? 'teal' : partial ? 'amber' : 'rose'}>{ready ? 'Hijau: siap' : partial ? 'Kuning: sebagian siap' : 'Merah: belum siap'}</Badge></div><ul className="mt-3 list-disc space-y-1 pl-5 text-sm">{notes.map((note) => <li key={note}>{note}</li>)}</ul></div>;

export const SystemReadinessCheck = ({ questions, scoringConfig, normTable, interpretationConfig, codeTypeConfig, settings }: { questions: Question[]; scoringConfig: ScoringConfig | null; normTable: unknown; interpretationConfig: unknown; codeTypeConfig: unknown; settings: AdminReportSettings }) => {
  const scoring = validateScoringConfigAdmin(scoringConfig, questions);
  const clinical = clinicalInterpretationReady({ questions, scoringConfig, normTable, interpretationConfig });
  const hasSettings = Boolean(settings.institutionName && settings.reportTitle && settings.defaultExaminer && settings.disclaimerText);
  const hasCodeType = Boolean(codeTypeConfig && !isDemoLikeConfig(codeTypeConfig));
  const testReady = questions.length === 567;
  const scoringReady = testReady && Boolean(scoringConfig) && scoring.valid;
  const specialistReady = clinical.ready && hasSettings;
  return <Card><h2 className="text-xl font-black">Status Kesiapan Sistem</h2><p className="mt-1 text-sm text-slate-500">Interpretasi spesialis hanya aktif ketika seluruh komponen resmi/berizin lengkap dan bukan demo.</p><div className="mt-5 grid gap-4">
    <StatusRow title="A. Siap Tes" ready={testReady} notes={[testReady ? 'Bank soal 567 item tersedia.' : `Bank soal belum 567 item (saat ini ${questions.length}).`]} />
    <StatusRow title="B. Siap Scoring" ready={scoringReady} partial={Boolean(scoringConfig || questions.length)} notes={scoringReady ? ['Bank soal tersedia.', 'ScoringConfig tersedia.', 'Semua questionId valid.'] : ['Bank soal dan scoringConfig harus tersedia.', ...(scoring.errors.length ? scoring.errors : ['Belum lolos validasi scoring.'])]} />
    <StatusRow title="C. Siap Interpretasi Klinis" ready={clinical.ready} partial={scoringReady || Boolean(normTable || interpretationConfig)} notes={clinical.ready ? ['Bank soal, scoringConfig, norma T-score, dan interpretationConfig lengkap.', 'Config bukan demo.', 'Skala validity dan clinical tersedia.'] : clinical.errors} />
    <StatusRow title="D. Siap Laporan Spesialis" ready={specialistReady} partial={clinical.ready || hasCodeType || hasSettings} notes={[...(specialistReady ? ['Semua syarat interpretasi klinis terpenuhi.', 'Admin settings laporan sudah diisi.'] : ['Semua syarat interpretasi klinis dan pengaturan laporan wajib terpenuhi.']), hasCodeType ? 'CodeTypeConfig tersedia.' : 'Code type spesifik belum tersedia; sistem harus menampilkan keterangan belum tersedia.', hasSettings ? 'Pengaturan laporan inti sudah diisi.' : 'Nama institusi, judul laporan, pemeriksa default, dan disclaimer belum lengkap.']} />
  </div></Card>;
};
