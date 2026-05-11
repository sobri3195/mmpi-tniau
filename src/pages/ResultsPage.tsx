import { useState } from 'react';
import type { AssessmentResult, ScoringConfig, SourceInterpretationResult, SummaryAnalysisConfig } from '../types';
import { ScoreCharts } from '../components/Charts';
import { InterpretationReport } from '../components/InterpretationReport';
import { ScoreTable } from '../components/ScoreTable';
import { Badge, Button, Card, Select, Textarea } from '../components/ui';
import { exportResultJson, exportResultsCsv, printReport } from '../utils/export';
import { generateSpecialistInterpretation } from '../utils/interpretation';
import { RHReportSection } from '../components/report/RHReportSection';
import { SummaryAnalysisSection } from '../components/report/SummaryAnalysisSection';
import { AppendixSection } from '../components/AppendixSection';
import { getRHFormByResultId, loadAuxiliaryConfig } from '../utils/storage';

const DISCLAIMER = 'Interpretasi Rusdi Maslim dan Hubertus ditampilkan sebagai bahan telaah profesional. Perbedaan hasil atau penekanan interpretasi harus ditinjau oleh spesialis/dokter jiwa/psikolog klinis. Laporan otomatis ini bukan diagnosis final dan tidak boleh menjadi satu-satunya dasar keputusan klinis, administratif, atau personel.';

export const ResultsPage = ({ result, scoringConfig, goHome }: { result: AssessmentResult; scoringConfig?: ScoringConfig | null; goHome: () => void }) => {
  const [tab, setTab] = useState<'summary' | 'rusdi' | 'hubertus' | 'summaryAnalysis' | 'rh' | 'review' | 'appendix'>('summary');
  const submittedAt = new Date(result.submittedAt);
  const submittedDateTime = submittedAt.toLocaleString('id-ID');
  const startedDate = result.startedDate || (result.startedAt ? result.startedAt.slice(0, 10) : '');
  const startedTime = result.startedTime || (result.startedAt ? new Date(result.startedAt).toLocaleTimeString('id-ID', { hour12: false }) : '');
  const submittedDate = result.submittedDate || result.submittedAt.slice(0, 10);
  const submittedTime = result.submittedTime || new Date(result.submittedAt).toLocaleTimeString('id-ID', { hour12: false });
  const report = generateSpecialistInterpretation(result, scoringConfig);
  const validityTone = result.validityStatus?.status === 'valid' ? 'teal' : result.validityStatus?.status === 'invalid' ? 'rose' : 'amber';
  const statusLabel = result.status === 'Perlu Review' ? 'Perlu telaah' : result.status;
  const dual = result.interpretations;
  const rhForm = getRHFormByResultId(result.id);
  const summaryAnalysisConfig = loadAuxiliaryConfig<SummaryAnalysisConfig>('summaryAnalysisConfig');
  const canPrintFinal = Boolean(result.rhCompleted && rhForm?.status === 'completed');
  const tabs = [
    ['summary', 'Ringkasan Skor dan Grafik'], ['rusdi', 'Interpretasi Rusdi Maslim'], ['hubertus', 'Interpretasi Hubertus'], ['summaryAnalysis', 'Analisa Ringkas TNI AU'], ['rh', 'RH Skrining'], ['review', 'Catatan Spesialis'], ['appendix', 'Lampiran'],
  ] as const;
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <Card className="mb-6 report-header">
        <div className="flex flex-wrap justify-between gap-4"><div><p className="text-sm font-bold text-teal-600">TNI AU / SPPG</p><h1 className="text-2xl font-black sm:text-3xl">Laporan hasil asesmen MMPI TNI AU/SPPG</h1><p className="text-slate-500">Bagian kepala laporan TNI AU/SPPG — asesmen satu kali, interpretasi ditampilkan di halaman hasil.</p></div><div className="flex flex-col items-start gap-2 sm:items-end"><Badge tone={result.status === 'Perlu Review' ? 'amber' : 'teal'}>{statusLabel}</Badge><Badge tone={validityTone}>{result.validityStatus?.label ?? 'Validitas belum dinilai'}</Badge></div></div>
        <AdministrativeSummary result={result} submittedDateTime={submittedDateTime} startedDate={startedDate} startedTime={startedTime} submittedDate={submittedDate} submittedTime={submittedTime} />
        {result.validityStatus?.reasons?.length ? <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-800"><p className="font-bold">Catatan validitas</p><ul className="mt-2 list-disc pl-5">{result.validityStatus.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></div> : null}
        <div className="mt-6 grid gap-3 no-print sm:flex sm:flex-wrap"><Button onClick={() => exportResultJson(result)}>Ekspor JSON</Button><Button variant="ghost" onClick={() => exportResultsCsv([result])}>Ekspor CSV</Button><Button variant="secondary" disabled={!canPrintFinal} onClick={printReport}>Cetak / PDF</Button><Button variant="ghost" onClick={goHome}>Beranda</Button></div>
      </Card>
      {!canPrintFinal && <Card className="mb-6 border-rose-200"><p className="font-bold text-rose-700">Laporan final belum dapat dicetak karena RH Skrining belum lengkap.</p></Card>}
      <div className="no-print mb-6 flex flex-wrap gap-2">{tabs.map(([id, label]) => <button key={id} type="button" onClick={() => setTab(id)} className={`rounded-2xl px-4 py-2 text-sm font-bold ${tab === id ? 'bg-teal-600 text-white' : 'bg-white shadow-sm hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800'}`}>TAB {tabs.findIndex(([key]) => key === id) + 1}: {label}</button>)}</div>

      <section className={tab === 'summary' ? 'space-y-6' : 'hidden print:block print:space-y-6'}>
        {!report.isDemo && <Card><h2 className="mb-3 text-xl font-black">Ringkasan skor utama</h2><p className="text-sm leading-6">{report.executiveSummary}</p><div className="mt-3"><Badge tone={report.reviewStatus === 'Dapat ditelaah' ? 'teal' : report.reviewStatus === 'Perlu telaah/tes ulang' ? 'rose' : 'amber'}>{report.reviewStatus}</Badge></div></Card>}
        <Card><h2 className="mb-4 text-xl font-black">Grafik T-score, Profil, Domain, dan Validitas</h2><ScoreCharts scores={result.scores} /></Card>
        <Card><h2 className="mb-4 text-xl font-black">Tabel skor</h2><ScoreTable scores={result.scores} /></Card>
      </section>

      <section className={tab === 'rusdi' ? '' : 'hidden print:block'}><Card className="mb-6"><SourceInterpretationSection title="Interpretasi Rusdi Maslim" interpretation={dual?.rusdiMaslim} unavailable="Interpretasi Rusdi Maslim belum diimpor admin." /></Card></section>
      <section className={tab === 'hubertus' ? '' : 'hidden print:block'}><Card className="mb-6"><SourceInterpretationSection title="Interpretasi Hubertus" interpretation={dual?.hubertus} unavailable="Interpretasi Hubertus belum diimpor admin." /></Card></section>
      <section className={tab === 'summaryAnalysis' ? '' : 'hidden print:block'}><SummaryAnalysisSection result={result} config={summaryAnalysisConfig} rhForm={rhForm} /></section>
      <section className={tab === 'rh' ? '' : 'hidden print:block'}><RHReportSection form={rhForm} /></section>
      <section className={tab === 'review' ? '' : 'hidden print:block'}><Card className="mb-6"><SpecialistFinalization result={result} /></Card></section>
      <section className={tab === 'appendix' ? '' : 'hidden print:block'}><AppendixSection result={result} scoringConfig={scoringConfig} /></section>
      {!report.isDemo && <Card className="mb-6 print:block"><InterpretationReport result={result} scoringConfig={scoringConfig} /></Card>}
      <Card className="mb-6"><h2 className="text-xl font-black">Disclaimer</h2><p className="mt-3 text-sm leading-6">{DISCLAIMER}</p></Card>
    </div>
  );
};

const AdministrativeSummary = ({ result, submittedDateTime, startedDate, startedTime, submittedDate, submittedTime }: { result: AssessmentResult; submittedDateTime: string; startedDate: string; startedTime: string; submittedDate: string; submittedTime: string }) => <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
  <Info label="Nama peserta" value={result.identity.name} /><Info label="Nomor peserta" value={result.identity.participantNumber || '-'} /><Info label="Tanggal lahir" value={result.identity.birthDateInput || result.identity.dateOfBirth || '-'} /><Info label="Usia" value={result.identity.age || '-'} /><Info label="Kesatuan" value={result.identity.unit || '-'} /><Info label="Asal satker" value={result.identity.originWorkUnit || '-'} />
  <Info label="Tanggal asesmen" value={result.identity.assessmentDate || submittedDateTime} /><Info label="Jam mulai" value={startedTime || '-'} /><Info label="Jam selesai" value={submittedTime || '-'} /><Info label="Tanggal mulai tes" value={startedDate || '-'} /><Info label="Tanggal selesai tes" value={submittedDate || '-'} /><Info label="Durasi" value={result.durationText ?? result.durationLabel ?? '-'} />
  <Info label="Total soal" value={String(result.totalQuestions)} /><Info label="Total dijawab" value={String(result.answeredCount)} /><Info label="Status validitas" value={result.validityStatus?.label ?? 'Belum tersedia'} />
</div>;

const SourceInterpretationSection = ({ title, interpretation, unavailable }: { title: string; interpretation?: SourceInterpretationResult; unavailable: string }) => {
  const unavailableMessage = interpretation?.message?.includes('Mode demo') ? interpretation.message : unavailable;
  if (!interpretation?.available) return <div><h2 className="text-xl font-black">{title}</h2><p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">{unavailableMessage}</p></div>;
  return <div><h2 className="text-xl font-black">{title}</h2><div className="mt-4 grid gap-4"><Narrative title="Validitas" text={interpretation.validityNarrative} /><Narrative title="Klinis / Skala" text={interpretation.clinicalNarrative} /><Narrative title="Code Type" text={interpretation.codeTypeNarrative} /><Narrative title="Domain" text={interpretation.domainNarrative} />{interpretation.recommendations.length ? <div><h3 className="font-black">Rekomendasi dari konfigurasi</h3><ul className="mt-2 list-disc pl-5 text-sm leading-6">{interpretation.recommendations.map((item) => <li key={item}>{item}</li>)}</ul></div> : <p className="text-sm text-slate-500">Rekomendasi belum tersedia dalam konfigurasi.</p>}</div></div>;
};

const Narrative = ({ title, text }: { title: string; text?: string }) => <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><h3 className="font-black">{title}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{text || 'Belum tersedia dalam konfigurasi yang diimpor admin.'}</p></div>;

const ComparisonSection = ({ result }: { result: AssessmentResult }) => {
  const comparison = result.interpretations?.comparison;
  return <div className="mt-4 grid gap-4 text-sm leading-6"><List title="Kesamaan temuan utama / Area yang sama" items={comparison?.similarities} /><List title="Perbedaan penekanan / Area yang berbeda" items={comparison?.differences} /><List title="Catatan kehati-hatian" items={comparison?.cautionNotes} /><p className="font-semibold text-amber-700">Kesimpulan final memerlukan telaah spesialis.</p></div>;
};

const SpecialistFinalization = ({ result }: { result: AssessmentResult }) => <div><h2 className="text-xl font-black">Catatan spesialis / finalisasi</h2><p className="mt-2 text-sm text-slate-500">Keputusan final tetap dibuat oleh spesialis/dokter jiwa/psikolog klinis. Pilihan di bawah adalah bahan finalisasi, bukan diagnosis otomatis.</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><label>Mode final<Select defaultValue={result.specialistReview?.selectedFinalInterpretation ?? 'not_selected'}><option value="rusdi_maslim">Final mengikuti Rusdi Maslim</option><option value="hubertus">Final mengikuti Hubertus</option><option value="combined_professional_review">Final berdasarkan telaah profesional gabungan</option><option value="further_interview">Perlu wawancara lanjutan</option><option value="retest_required">Perlu tes ulang</option><option value="referral_required">Perlu rujukan</option><option value="not_selected">Belum dipilih</option></Select></label><label>Reviewer<Textarea readOnly value={`${result.specialistReview?.reviewerName || ''}${result.specialistReview?.reviewerTitle ? `, ${result.specialistReview.reviewerTitle}` : ''}`} placeholder="Diisi melalui halaman telaah spesialis" /></label></div><div className="mt-4 grid gap-4"><Narrative title="Catatan klinis" text={result.specialistReview?.clinicalImpression || result.specialistReview?.validityNotes} /><Narrative title="Kesimpulan final spesialis" text={result.specialistReview?.finalConclusion} /><Narrative title="Rekomendasi akhir setelah telaah profesional" text={result.specialistReview?.recommendations} /></div></div>;

const List = ({ title, items }: { title: string; items?: string[] }) => <div><h3 className="font-black">{title}</h3>{items?.length ? <ul className="mt-2 list-disc pl-5">{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="mt-2 text-slate-500">Belum tersedia karena salah satu/kedua konfigurasi belum tersedia atau belum valid.</p>}</div>;
const Info = ({ label, value }: { label: string; value: string }) => <div className="rounded-2xl bg-slate-50 p-3 sm:p-4 dark:bg-slate-800"><p className="text-xs uppercase text-slate-500">{label}</p><p className="font-bold">{value}</p></div>;
