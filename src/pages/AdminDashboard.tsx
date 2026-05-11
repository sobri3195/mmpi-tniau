import { useMemo, useState } from 'react';
import type { AssessmentResult, Question, ScoringConfig } from '../types';
import { Badge, Button, Card, Input, PrivacyNotice } from '../components/ui';
import { downloadFile, exportResultsCsv, exportResultsJson } from '../utils/export';
import { clearScoringConfig, loadDemoQuestions, loadDemoScoringConfig, resetAllLocalData, resetParticipantData, saveAuxiliaryConfig, saveQuestions, saveResults, saveScoringConfig } from '../utils/storage';
import { summarizeScoringConfig, validateScoringConfig } from '../utils/scoring';

const parseBool = (v: string) => ['true', '1', 'ya', 'yes', 'benar'].includes(v.trim().toLowerCase());
const parseCsv = (text: string): Question[] => {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(',').map((h) => h.trim());
  return lines.filter(Boolean).map((line) => {
    const cols = line.split(',').map((c) => c.trim());
    const row = Object.fromEntries(headers.map((h, i) => [h, cols[i] ?? '']));
    const type = (row.responseType || 'true_false') as Question['responseType'];
    return { id: Number(row.id), code: row.code, text: row.text, responseType: type, required: row.required ? parseBool(row.required) : true, options: type === 'yes_no' ? [{ label: 'Ya', value: true }, { label: 'Tidak', value: false }] : [{ label: 'Benar', value: true }, { label: 'Salah', value: false }] };
  });
};

export const AdminDashboard = ({ questions, config, results, refresh, openResult }: { questions: Question[]; config: ScoringConfig | null; results: AssessmentResult[]; refresh: () => void; openResult: (r: AssessmentResult) => void }) => {
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [pendingConfig, setPendingConfig] = useState<ScoringConfig | null>(null);
  const scoringSummary = summarizeScoringConfig(pendingConfig ?? config, questions);
  const filtered = useMemo(() => results.filter((r) => `${r.identity.name} ${r.identity.participantNumber} ${r.identity.unit}`.toLowerCase().includes(query.toLowerCase())), [results, query]);

  const importFile = (kind: 'questions' | 'scoring' | 'interpretation' | 'norm' | 'codeType') => async (file?: File) => {
    if (!file) return;
    try {
      const text = await file.text();
      if (kind === 'questions') {
        const data = file.name.endsWith('.csv') ? parseCsv(text) : JSON.parse(text);
        if (!Array.isArray(data) || !data.length) throw new Error('Bank soal harus array dan tidak kosong.');
        saveQuestions(data); setMessage(`Berhasil import ${data.length} soal ke key localStorage utama.`);
        refresh();
      } else if (kind === 'scoring') {
        const data = JSON.parse(text) as ScoringConfig;
        const err = validateScoringConfig(data, questions);
        setPendingConfig(data);
        setMessage(err ? `File terbaca, tetapi belum valid: ${err}` : `File scoringConfig terbaca: ${data.scales.length} skala. Klik “Gunakan Konfigurasi Ini” untuk menyimpan.`);
      } else {
        const data = JSON.parse(text);
        const storageKey = kind === 'interpretation' ? 'interpretationConfig' : kind === 'norm' ? 'normTable' : 'codeTypeConfig';
        saveAuxiliaryConfig(storageKey, data);
        setMessage(`${file.name} berhasil disimpan ke localStorage sebagai ${storageKey}. Integrasikan isi file tersebut ke scoringConfig resmi bila diperlukan untuk scoring/interpretasi final.`);
      }
    } catch (err) { setMessage(`Gagal import: ${err instanceof Error ? err.message : 'format tidak valid'}`); }
  };

  const useConfig = () => {
    const candidate = pendingConfig ?? config;
    const err = validateScoringConfig(candidate, questions);
    if (!candidate || err) { setMessage(`Konfigurasi belum dapat digunakan: ${err || 'file belum dipilih'}`); return; }
    saveScoringConfig(candidate); setPendingConfig(null); setMessage(`Konfigurasi scoring aktif disimpan ke localStorage: ${candidate.scales.length} skala.`); refresh();
  };
  const remove = (id: string) => { saveResults(results.filter((r) => r.id !== id)); refresh(); };
  const loadDemo = () => {
    const bundledQuestions = loadDemoQuestions();
    saveQuestions(bundledQuestions);
    setPendingConfig(loadDemoScoringConfig());
    setMessage(`Bank soal bawaan berhasil dimuat: ${bundledQuestions.length} soal. Sample scoring hanya DUMMY CONFIG - BUKAN SCORING MMPI RESMI; klik “Gunakan Konfigurasi Ini” bila ingin menguji flow.`);
    refresh();
  };
  const exportConfig = () => {
    const candidate = pendingConfig ?? config;
    if (!candidate) { setMessage('Tidak ada scoring config untuk diexport.'); return; }
    downloadFile('scoringConfig-sppg-mmpi2.json', JSON.stringify(candidate, null, 2));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <div className="mb-6 grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between"><div><h1 className="text-2xl font-black sm:text-3xl">Admin Dashboard</h1><p className="text-slate-500">Kelola bank soal berizin, scoring, hasil, dan data lokal.</p></div><Button variant="ghost" onClick={refresh}>Refresh</Button></div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card><h2 className="font-black">Bank Soal</h2><p className="mt-2 text-sm text-slate-500">Preview: {questions.length} soal</p>{questions.length !== 567 && <p className="mt-3 text-sm font-bold text-amber-700">Warning: total item harus 567 untuk laporan MMPI-2 final.</p>}<input className="mt-4 block w-full text-sm" type="file" accept=".json,.csv" onChange={(e) => importFile('questions')(e.target.files?.[0])} /></Card>
        <Card className="lg:col-span-2"><h2 className="font-black">Scoring Config</h2><p className="mt-2 text-sm text-slate-500">{(pendingConfig ?? config)?.instrumentName ?? 'Belum tersedia'}</p>{pendingConfig && <Badge tone="amber">Preview belum aktif</Badge>}<input className="mt-4 block w-full text-sm" type="file" accept=".json" onChange={(e) => importFile('scoring')(e.target.files?.[0])} />
          <div className="mt-4 grid gap-3 md:grid-cols-2"><Status label="Jumlah skala" value={String(scoringSummary.scaleCount)} /><Status label="Item scoring terhubung" value={String(scoringSummary.connectedItems)} /><Status label="Skala validitas" value={scoringSummary.validityScales.map((s) => s.code ?? s.id).join(', ') || '-'} /><Status label="Skala klinis" value={scoringSummary.clinicalScales.map((s) => s.code ?? s.id).join(', ') || '-'} /></div>
          <div className={`mt-4 rounded-2xl p-4 text-sm font-semibold ${scoringSummary.isFinalReady ? 'bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-100' : 'bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100'}`}>Status final: {scoringSummary.isFinalReady ? 'siap laporan final' : scoringSummary.finalValidationMessage}</div>{scoringSummary.isDemo && <div className="mt-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm font-bold text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">Konfigurasi yang digunakan masih demo/placeholder. Laporan ini tidak valid untuk interpretasi klinis atau personel.</div>}
          <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap"><Button onClick={useConfig}>Gunakan Konfigurasi Ini</Button><Button variant="ghost" onClick={exportConfig}>Export Scoring Config</Button><Button variant="danger" onClick={() => { clearScoringConfig(); setPendingConfig(null); setMessage('Konfigurasi scoring dihapus dari localStorage.'); refresh(); }}>Hapus Konfigurasi Scoring</Button></div>
        </Card>
        <Card className="lg:col-span-3"><h2 className="font-black">Import Konfigurasi Resmi/Berizin Tambahan</h2><p className="mt-2 text-sm text-slate-500">Admin dapat mengimpor interpretationConfig.json, normTable.json, dan codeTypeConfig.json. Data tetap di localStorage dan tidak dikirim ke server.</p><div className="mt-4 grid gap-3 md:grid-cols-3"><label className="text-sm font-semibold">interpretationConfig.json<input className="mt-2 block w-full text-sm font-normal" type="file" accept=".json" onChange={(e) => importFile('interpretation')(e.target.files?.[0])} /></label><label className="text-sm font-semibold">normTable.json<input className="mt-2 block w-full text-sm font-normal" type="file" accept=".json" onChange={(e) => importFile('norm')(e.target.files?.[0])} /></label><label className="text-sm font-semibold">codeTypeConfig.json<input className="mt-2 block w-full text-sm font-normal" type="file" accept=".json" onChange={(e) => importFile('codeType')(e.target.files?.[0])} /></label></div></Card><Card className="lg:col-span-3"><h2 className="font-black">Aksi Data</h2><div className="mt-4 grid gap-2 sm:flex sm:flex-wrap"><Button onClick={loadDemo}>Muat 567 Soal Bawaan + Sample Config</Button><Button variant="ghost" onClick={() => exportResultsJson(results)}>Export JSON</Button><Button variant="ghost" onClick={() => exportResultsCsv(results)}>Export CSV</Button><Button variant="danger" onClick={() => { resetParticipantData(); setMessage('Data peserta/draft/hasil dihapus. Bank soal dan scoring config tetap ada.'); refresh(); }}>Hapus Data Peserta</Button><Button variant="danger" onClick={() => { resetAllLocalData(); setPendingConfig(null); setMessage('Semua data localStorage aplikasi direset.'); refresh(); }}>Reset Aplikasi</Button></div></Card>
      </div>
      {message && <div className="mt-6"><Card><p className="font-semibold">{message}</p></Card></div>}
      <div className="mt-6"><PrivacyNotice /></div>
      <Card className="mt-6"><div className="grid gap-3 md:grid-cols-[1fr_minmax(16rem,24rem)] md:items-center"><h2 className="text-xl font-black">Daftar Hasil Peserta</h2><Input placeholder="Search/filter peserta..." value={query} onChange={(e) => setQuery(e.target.value)} /></div><div className="mt-4 space-y-3 md:hidden">{filtered.map((r) => <ResultCard key={r.id} result={r} openResult={openResult} remove={remove} />)}{!filtered.length && <p className="py-6 text-center text-slate-500">Belum ada hasil.</p>}</div><div className="mt-4 hidden overflow-x-auto md:block"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b text-left text-xs uppercase text-slate-500"><th className="py-3">Nama</th><th>Unit</th><th>Tanggal</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{filtered.map((r) => <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800"><td className="py-3 font-bold">{r.identity.name}</td><td>{r.identity.unit}</td><td>{new Date(r.submittedAt).toLocaleString('id-ID')}</td><td><Badge tone="amber">{r.status}</Badge></td><td className="space-x-2"><Button variant="ghost" onClick={() => openResult(r)}>Detail</Button><Button variant="danger" onClick={() => remove(r.id)}>Hapus</Button></td></tr>)}</tbody></table>{!filtered.length && <p className="py-6 text-center text-slate-500">Belum ada hasil.</p>}</div></Card>
    </div>
  );
};

const Status = ({ label, value }: { label: string; value: string }) => <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800"><p className="text-xs uppercase text-slate-500">{label}</p><p className="font-bold">{value}</p></div>;
const ResultCard = ({ result: r, openResult, remove }: { result: AssessmentResult; openResult: (r: AssessmentResult) => void; remove: (id: string) => void }) => <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{r.identity.name}</p><p className="text-sm text-slate-500">{r.identity.unit}</p></div><Badge tone="amber">{r.status}</Badge></div><p className="mt-2 text-sm text-slate-500">{new Date(r.submittedAt).toLocaleString('id-ID')}</p><div className="mt-4 grid grid-cols-2 gap-2"><Button variant="ghost" onClick={() => openResult(r)}>Detail</Button><Button variant="danger" onClick={() => remove(r.id)}>Hapus</Button></div></div>;
