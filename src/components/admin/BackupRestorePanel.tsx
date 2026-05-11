import { useState } from 'react';
import { Button, Card, Input } from '../ui';
import { downloadFile } from '../../utils/export';
import { createBackupPayload, resetKeys, restoreBackupPayload, type BackupPayload } from '../../utils/backupRestore';
import { AlertBox, PanelTitle } from './AdminCommon';

const resetOptions = {
  results: { label: 'Reset hasil peserta saja', keys: ['results', 'currentSession'] as const },
  questions: { label: 'Reset bank soal saja', keys: ['questions'] as const },
  scoring: { label: 'Reset scoring config saja', keys: ['scoringConfig'] as const },
  all: { label: 'Reset semua data aplikasi', keys: ['questions', 'scoringConfig', 'normTable', 'interpretationConfig', 'codeTypeConfig', 'results', 'currentSession', 'adminSettings'] as const },
};

export const BackupRestorePanel = ({ onRefresh, toast }: { onRefresh: () => void; toast: (message: string, tone?: 'teal' | 'amber' | 'rose') => void }) => {
  const [pendingReset, setPendingReset] = useState<keyof typeof resetOptions | null>(null);
  const [confirmation, setConfirmation] = useState('');
  const importBackup = async (file?: File) => {
    if (!file) return;
    const payload = JSON.parse(await file.text()) as BackupPayload;
    restoreBackupPayload(payload);
    onRefresh();
    toast('Cadangan berhasil diimpor.', 'teal');
  };
  return <Card><PanelTitle title="Reset dan cadangan" subtitle="Ekspor/impor seluruh data aplikasi dan reset data tertentu. Reset wajib dikonfirmasi dengan mengetik RESET." />
    <AlertBox tone="amber">Sebelum reset, sistem meminta konfirmasi: <strong>Ketik RESET untuk melanjutkan.</strong></AlertBox>
    <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap"><Button onClick={() => downloadFile(`backup-sppg-mmpi2-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(createBackupPayload(), null, 2))}>Ekspor cadangan JSON</Button><input className="block w-full text-sm sm:w-auto" type="file" accept=".json" onChange={(event) => importBackup(event.target.files?.[0]).catch((error) => toast(error instanceof Error ? error.message : 'Gagal mengimpor cadangan.', 'rose'))} /></div>
    <div className="mt-6 grid gap-3 md:grid-cols-2">{Object.entries(resetOptions).map(([key, item]) => <button type="button" key={key} onClick={() => { setPendingReset(key as keyof typeof resetOptions); setConfirmation(''); }} className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-left font-bold text-rose-800 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100">{item.label}</button>)}</div>
    {pendingReset && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"><div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900"><h3 className="text-xl font-black">Konfirmasi Reset</h3><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{resetOptions[pendingReset].label}. Ketik RESET untuk melanjutkan.</p><div className="mt-4"><Input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder="Ketik RESET" /></div><div className="mt-5 flex flex-wrap gap-3"><Button variant="danger" disabled={confirmation !== 'RESET'} onClick={() => { resetKeys([...resetOptions[pendingReset].keys]); setPendingReset(null); setConfirmation(''); onRefresh(); toast('Reset berhasil dijalankan.', 'amber'); }}>Konfirmasi Reset</Button><Button variant="ghost" onClick={() => setPendingReset(null)}>Batal</Button></div></div></div>}
  </Card>;
};
