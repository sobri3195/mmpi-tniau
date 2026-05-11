import { useMemo, useState } from 'react';
import type { AssessmentResult, Question, ScoringConfig } from '../types';
import { Badge, Button, Card, Input, PrivacyNotice } from '../components/ui';
import { exportResultsCsv, exportResultsJson } from '../utils/export';
import { loadDemoQuestions, loadDemoScoringConfig, resetAllLocalData, saveQuestions, saveResults, saveScoringConfig } from '../utils/storage';
import { validateScoringConfig } from '../utils/scoring';

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
  const filtered = useMemo(() => results.filter((r) => `${r.identity.name} ${r.identity.participantNumber} ${r.identity.unit}`.toLowerCase().includes(query.toLowerCase())), [results, query]);
  const importFile = (kind: 'questions' | 'scoring') => async (file?: File) => {
    if (!file) return;
    try {
      const text = await file.text();
      if (kind === 'questions') {
        const data = file.name.endsWith('.csv') ? parseCsv(text) : JSON.parse(text);
        if (!Array.isArray(data) || !data.length) throw new Error('Bank soal harus array dan tidak kosong.');
        saveQuestions(data); setMessage(`Berhasil import ${data.length} soal.`);
      } else {
        const data = JSON.parse(text);
        const err = validateScoringConfig(data);
        if (err) throw new Error(err);
        saveScoringConfig(data); setMessage(`Berhasil import konfigurasi ${data.scales.length} skala.`);
      }
      refresh();
    } catch (err) { setMessage(`Gagal import: ${err instanceof Error ? err.message : 'format tidak valid'}`); }
  };
  const remove = (id: string) => { saveResults(results.filter((r) => r.id !== id)); refresh(); };
  const loadDemo = () => {
    const bundledQuestions = loadDemoQuestions();
    saveQuestions(bundledQuestions);
    saveScoringConfig(loadDemoScoringConfig());
    setMessage(`Bank soal bawaan berhasil dimuat: ${bundledQuestions.length} soal. Konfigurasi scoring tetap demo dan jangan gunakan untuk diagnosis.`);
    refresh();
  };
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <div className="mb-6 grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between"><div><h1 className="text-2xl font-black sm:text-3xl">Admin Dashboard</h1><p className="text-slate-500">Kelola bank soal berizin, scoring, hasil, dan data lokal.</p></div><Button variant="ghost" onClick={() => location.reload()}>Refresh</Button></div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card><h2 className="font-black">Bank Soal</h2><p className="mt-2 text-sm text-slate-500">Preview: {questions.length} soal</p>{!questions.length && <p className="mt-3 text-sm font-bold text-amber-700">Warning: belum ada question bank.</p>}<input className="mt-4 block w-full text-sm" type="file" accept=".json,.csv" onChange={(e) => importFile('questions')(e.target.files?.[0])} /></Card>
        <Card><h2 className="font-black">Scoring Config</h2><p className="mt-2 text-sm text-slate-500">{config?.instrumentName ?? 'Belum tersedia'}</p>{validateScoringConfig(config) && <p className="mt-3 text-sm font-bold text-amber-700">{validateScoringConfig(config)}</p>}<input className="mt-4 block w-full text-sm" type="file" accept=".json" onChange={(e) => importFile('scoring')(e.target.files?.[0])} /></Card>
        <Card><h2 className="font-black">Aksi Data</h2><div className="mt-4 grid gap-2 sm:flex sm:flex-wrap"><Button onClick={loadDemo}>Muat 567 Soal Bawaan</Button><Button variant="ghost" onClick={() => exportResultsJson(results)}>Export JSON</Button><Button variant="ghost" onClick={() => exportResultsCsv(results)}>Export CSV</Button><Button variant="danger" onClick={() => { if (confirm('Hapus semua data lokal?')) { resetAllLocalData(); refresh(); } }}>Reset Semua</Button></div></Card>
      </div>
      {message && <div className="mt-6"><Card><p className="font-semibold">{message}</p></Card></div>}
      <div className="mt-6"><PrivacyNotice /></div>
      <Card className="mt-6"><div className="grid gap-3 md:grid-cols-[1fr_minmax(16rem,24rem)] md:items-center"><h2 className="text-xl font-black">Daftar Hasil Peserta</h2><Input placeholder="Search/filter peserta..." value={query} onChange={(e) => setQuery(e.target.value)} /></div><div className="mt-4 space-y-3 md:hidden">{filtered.map((r) => <div key={r.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{r.identity.name}</p><p className="text-sm text-slate-500">{r.identity.unit}</p></div><Badge tone="amber">{r.status}</Badge></div><p className="mt-2 text-sm text-slate-500">{new Date(r.submittedAt).toLocaleString('id-ID')}</p><div className="mt-4 grid grid-cols-2 gap-2"><Button variant="ghost" onClick={() => openResult(r)}>Detail</Button><Button variant="danger" onClick={() => remove(r.id)}>Hapus</Button></div></div>)}{!filtered.length && <p className="py-6 text-center text-slate-500">Belum ada hasil.</p>}</div><div className="mt-4 hidden overflow-x-auto md:block"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b text-left text-xs uppercase text-slate-500"><th className="py-3">Nama</th><th>Unit</th><th>Tanggal</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{filtered.map((r) => <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800"><td className="py-3 font-bold">{r.identity.name}</td><td>{r.identity.unit}</td><td>{new Date(r.submittedAt).toLocaleString('id-ID')}</td><td><Badge tone="amber">{r.status}</Badge></td><td className="space-x-2"><Button variant="ghost" onClick={() => openResult(r)}>Detail</Button><Button variant="danger" onClick={() => remove(r.id)}>Hapus</Button></td></tr>)}</tbody></table>{!filtered.length && <p className="py-6 text-center text-slate-500">Belum ada hasil.</p>}</div></Card>
    </div>
  );
};
