import { useMemo, useState } from 'react';
import type { Question } from '../../types';
import { Button, Card } from '../ui';
import { downloadFile } from '../../utils/export';
import { saveAdminQuestions, clearAdminDataKey } from '../../utils/adminStorage';
import { validateQuestions, type ValidationResult } from '../../utils/configValidation';
import { normalizeQuestions } from '../../utils/questions';
import { parseQuestionsCsv } from '../../utils/csvImport';
import { EmptyState, PanelTitle, TemplateButton, ValidationMessages } from './AdminCommon';

const templateQuestions = Array.from({ length: 3 }, (_, index) => ({ id: index + 1, number: index + 1, order: index + 1, code: `ITEM_${index + 1}`, text: `Placeholder item ${index + 1} - ganti dengan item resmi/berizin`, responseType: 'plus_minus', required: true, options: [{ label: '+', value: '+' }, { label: '-', value: '-' }] }));

export const ImportQuestionsPanel = ({ questions, onRefresh, toast }: { questions: Question[]; onRefresh: () => void; toast: (message: string, tone?: 'teal' | 'amber' | 'rose') => void }) => {
  const [draft, setDraft] = useState<Question[] | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(questions.length ? validateQuestions(questions) : null);
  const active = draft ?? questions;
  const preview = useMemo(() => active.slice(0, 10), [active]);

  const importFile = async (file?: File) => {
    if (!file) return;
    const text = await file.text();
    const parsed = file.name.toLowerCase().endsWith('.csv') ? parseQuestionsCsv(text) : JSON.parse(text);
    const result = validateQuestions(parsed);
    setDraft(normalizeQuestions(parsed));
    setValidation(result);
    toast(result.valid ? 'File bank soal terbaca. Klik Simpan bank soal untuk mengaktifkan.' : 'File bank soal memiliki error validasi.', result.valid ? 'teal' : 'rose');
  };

  return <Card>
    <PanelTitle title="Impor bank soal" subtitle="Unggah questions.json atau questions.csv. Kode sumber tidak menyertakan soal MMPI asli; gunakan file resmi/berizin." />
    <div className="mt-4 grid gap-3 sm:flex sm:flex-wrap">
      <input className="block w-full text-sm sm:w-auto" type="file" accept=".json,.csv" onChange={(event) => importFile(event.target.files?.[0]).catch((error) => { setValidation({ valid: false, errors: [error instanceof Error ? error.message : 'Gagal membaca file.'], warnings: [] }); toast('Gagal mengimpor bank soal.', 'rose'); })} />
      <TemplateButton filename="template_questions.json" data={templateQuestions} />
      <Button variant="ghost" onClick={() => { const result = validateQuestions(active); setValidation(result); toast('Validasi ulang bank soal selesai.', result.valid ? 'teal' : 'rose'); }}>Validasi ulang</Button>
    </div>
    <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950"><p className="text-xs font-bold uppercase text-slate-500">Jumlah soal</p><p className="text-2xl font-black">{active.length}</p></div><div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950"><p className="text-xs font-bold uppercase text-slate-500">Status</p><p className="font-bold text-teal-700">{active.length === 567 && validation?.valid ? 'Bank soal siap digunakan.' : 'Belum siap final'}</p></div></div>
    <div className="mt-4"><ValidationMessages result={validation} /></div>
    <div className="mt-5 overflow-x-auto">{preview.length ? <table className="min-w-full text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="p-2">Nomor</th><th className="p-2">ID</th><th className="p-2">Code</th><th className="p-2">Teks</th><th className="p-2">Respons</th></tr></thead><tbody>{preview.map((question) => <tr key={question.id} className="border-t border-slate-100 dark:border-slate-800"><td className="p-2 font-mono">{String(question.number ?? question.order ?? '-').padStart(3, '0')}</td><td className="p-2">{question.id}</td><td className="p-2 font-mono">{question.code}</td><td className="p-2">{question.text}</td><td className="p-2">{question.responseType}</td></tr>)}</tbody></table> : <EmptyState title="Belum ada bank soal" />}</div>
    <div className="mt-5 flex flex-wrap gap-3"><Button disabled={!draft || !validation?.valid} onClick={() => { if (draft) saveAdminQuestions(draft); setDraft(null); onRefresh(); toast('Bank soal disimpan.', 'teal'); }}>Simpan bank soal</Button><Button variant="danger" onClick={() => { clearAdminDataKey('questions'); onRefresh(); toast('Bank soal dihapus.', 'amber'); }}>Hapus bank soal</Button><Button variant="secondary" disabled={!active.length} onClick={() => downloadFile('questions-export.json', JSON.stringify(active, null, 2))}>Ekspor bank soal</Button></div>
  </Card>;
};
