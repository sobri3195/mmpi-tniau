import { useState } from 'react';
import { Button, Card, Input, Select } from '../ui';
import { loadAdminSettings, saveAdminSettings, type AdminReportSettings } from '../../utils/adminStorage';
import { PanelTitle } from './AdminCommon';
import { detectLegacyResponseData, hasLegacyResponseData, migrateLegacyResponses } from '../../utils/legacyMigration';

export const AdminSettingsPanel = ({ onRefresh, toast }: { onRefresh: () => void; toast: (message: string, tone?: 'teal' | 'amber' | 'rose') => void }) => {
  const [settings, setSettings] = useState<AdminReportSettings>(() => ({ showClinicalChart: true, showValidityChart: true, showRawScore: true, showAnswers: false, reportMode: 'Screening', ...loadAdminSettings() }));
  const [legacyReport, setLegacyReport] = useState(() => detectLegacyResponseData());
  const set = (patch: Partial<AdminReportSettings>) => setSettings((prev) => ({ ...prev, ...patch }));
  const migrateLegacy = () => {
    if (!hasLegacyResponseData()) { toast('Tidak ada data lama yang perlu dimigrasi.', 'teal'); return; }
    const confirmed = window.confirm('Migrasi data lama akan mengubah jawaban Ya/Tidak, Benar/Salah, true/false menjadi string + dan -. Lanjutkan?');
    if (!confirmed) return;
    const report = migrateLegacyResponses();
    setLegacyReport(detectLegacyResponseData());
    onRefresh();
    toast(`Migrasi selesai. Results lama: ${report.results}, token session lama: ${report.tokenSessions}.`, 'teal');
  };
  return <Card><PanelTitle title="Pengaturan Laporan" subtitle="Atur identitas institusi, pemeriksa, disclaimer, tampilan grafik/skor/jawaban, dan mode laporan." />
    <div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-bold">Nama institusi<Input value={settings.institutionName ?? ''} onChange={(e) => set({ institutionName: e.target.value })} /></label><label className="text-sm font-bold">Logo institusi (URL/base64)<Input value={settings.institutionLogo ?? ''} onChange={(e) => set({ institutionLogo: e.target.value })} /></label><label className="text-sm font-bold">Judul laporan<Input value={settings.reportTitle ?? ''} onChange={(e) => set({ reportTitle: e.target.value })} /></label><label className="text-sm font-bold">Subjudul laporan<Input value={settings.reportSubtitle ?? ''} onChange={(e) => set({ reportSubtitle: e.target.value })} /></label><label className="text-sm font-bold">Nama pemeriksa default<Input value={settings.defaultExaminer ?? ''} onChange={(e) => set({ defaultExaminer: e.target.value })} /></label><label className="text-sm font-bold">Nomor SIP/izin praktik<Input value={settings.licenseNumber ?? ''} onChange={(e) => set({ licenseNumber: e.target.value })} /></label><label className="text-sm font-bold md:col-span-2">Teks disclaimer<Input value={settings.disclaimerText ?? ''} onChange={(e) => set({ disclaimerText: e.target.value })} /></label><label className="text-sm font-bold md:col-span-2">Teks tanda tangan<Input value={settings.signatureText ?? ''} onChange={(e) => set({ signatureText: e.target.value })} /></label><label className="text-sm font-bold">Mode laporan<Select value={settings.reportMode ?? 'Screening'} onChange={(e) => set({ reportMode: e.target.value as AdminReportSettings['reportMode'] })}><option>Screening</option><option>Klinis</option><option>Personel/Militer</option></Select></label></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[['showClinicalChart', 'Tampilkan grafik klinis'], ['showValidityChart', 'Tampilkan grafik validitas'], ['showRawScore', 'Tampilkan raw score'], ['showAnswers', 'Tampilkan jawaban peserta']].map(([key, label]) => <label key={key} className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3 text-sm font-bold dark:bg-slate-950"><input type="checkbox" checked={Boolean(settings[key as keyof AdminReportSettings])} onChange={(e) => set({ [key]: e.target.checked } as Partial<AdminReportSettings>)} />{label}</label>)}</div>
    <div className="mt-5"><Button onClick={() => { saveAdminSettings(settings); onRefresh(); toast('Pengaturan laporan disimpan.', 'teal'); }}>Simpan Pengaturan</Button></div>
    <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
      <h3 className="font-black text-amber-900 dark:text-amber-100">Migrasi format jawaban lama</h3>
      <p className="mt-2 text-sm text-amber-900 dark:text-amber-100">Konversi data lokal lama dari Ya/Tidak, Benar/Salah, true/false menjadi string "+" dan "-" untuk bank soal, scoringConfig, draft, hasil, dan token session.</p>
      <p className="mt-2 text-xs font-semibold text-amber-900 dark:text-amber-100">Terdeteksi: bank soal {legacyReport.questions ? 'lama' : 'OK'}, scoringConfig {legacyReport.scoringConfig ? 'lama' : 'OK'}, draft {legacyReport.currentSession ? 'lama' : 'OK'}, results lama {legacyReport.results}, token session lama {legacyReport.tokenSessions}.</p>
      <Button className="mt-3" variant="secondary" onClick={migrateLegacy}>Konfirmasi & Migrasi ke + / -</Button>
    </div>
  </Card>;
};
