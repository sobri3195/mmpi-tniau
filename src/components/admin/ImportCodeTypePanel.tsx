import { useState } from 'react';
import { Button, Card } from '../ui';
import { downloadFile } from '../../utils/export';
import { clearAdminDataKey, saveAuxConfig } from '../../utils/adminStorage';
import { validateCodeTypeConfig, type ValidationResult } from '../../utils/configValidation';
import { EmptyState, PanelTitle, TemplateButton, ValidationMessages } from './AdminCommon';

const template = [{ code: '1', title: 'Placeholder 1-point code type', interpretation: 'Placeholder - ganti dengan interpretasi resmi/berizin.', cautionNotes: ['Tidak untuk laporan final.'], recommendation: 'Review oleh pemeriksa berwenang.' }, { code: '1-2', title: 'Placeholder 2-point code type', interpretation: 'Placeholder.', cautionNotes: ['Placeholder.'], recommendation: 'Placeholder.' }];

export const ImportCodeTypePanel = ({ config, onRefresh, toast }: { config: unknown; onRefresh: () => void; toast: (message: string, tone?: 'teal' | 'amber' | 'rose') => void }) => {
  const [draft, setDraft] = useState<unknown | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(config ? validateCodeTypeConfig(config) : null);
  const active = draft ?? config;
  const rows = Array.isArray(active) ? active : Object.values((active as Record<string, unknown>) ?? {});
  const importFile = async (file?: File) => { if (!file) return; const parsed = JSON.parse(await file.text()); const result = validateCodeTypeConfig(parsed); setDraft(parsed); setValidation(result); toast(result.valid ? 'Code type config terbaca.' : 'Code type config memiliki error.', result.valid ? 'teal' : 'rose'); };
  return <Card><PanelTitle title="Import Code Type Config" subtitle="Upload codeTypeConfig.json untuk 1-point, 2-point, dan 3-point code type; tidak ada hardcode interpretasi code type di aplikasi." />
    <div className="grid gap-3 sm:flex sm:flex-wrap"><input className="block w-full text-sm sm:w-auto" type="file" accept=".json" onChange={(event) => importFile(event.target.files?.[0]).catch((error) => { setValidation({ valid: false, errors: [error instanceof Error ? error.message : 'Gagal membaca file.'], warnings: [] }); toast('Gagal import code type.', 'rose'); })} /><TemplateButton filename="template_codeTypeConfig.json" data={template} /><Button variant="ghost" onClick={() => { const result = validateCodeTypeConfig(active); setValidation(result); toast('Validasi code type selesai.', result.valid ? 'teal' : 'rose'); }}>Validasi Ulang</Button></div>
    <div className="mt-4"><ValidationMessages result={validation} /></div>
    <div className="mt-5 overflow-x-auto">{rows.length ? <table className="min-w-full text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="p-2">Code</th><th className="p-2">Title</th><th className="p-2">Caution</th><th className="p-2">Recommendation</th></tr></thead><tbody>{rows.map((row, index) => { const item = row as Record<string, unknown>; return <tr key={`${item.code ?? index}`} className="border-t border-slate-100 dark:border-slate-800"><td className="p-2 font-mono">{String(item.code ?? '-')}</td><td className="p-2">{String(item.title ?? '-')}</td><td className="p-2">{Array.isArray(item.cautionNotes) ? item.cautionNotes.join('; ') : String(item.cautionNotes ?? '-')}</td><td className="p-2">{String(item.recommendation ?? '-')}</td></tr>; })}</tbody></table> : <EmptyState title="Belum ada codeTypeConfig" />}</div>
    <div className="mt-5 flex flex-wrap gap-3"><Button disabled={!draft || !validation?.valid} onClick={() => { if (draft !== null) saveAuxConfig('codeTypeConfig', draft); setDraft(null); onRefresh(); toast('Code type config disimpan.', 'teal'); }}>Simpan Code Type Config</Button><Button variant="danger" onClick={() => { clearAdminDataKey('codeTypeConfig'); onRefresh(); toast('Code type config dihapus.', 'amber'); }}>Hapus</Button><Button variant="secondary" disabled={!active} onClick={() => downloadFile('codeTypeConfig-export.json', JSON.stringify(active, null, 2))}>Export</Button></div>
  </Card>;
};
