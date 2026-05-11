import type { AutoFixResult } from '../../utils/systemReadiness';
import { Button, Card } from '../ui';

export const AutoFixConfigModal = ({ result, onApply, onClose }: { result: AutoFixResult | null; onApply: () => void; onClose: () => void }) => {
  if (!result) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
    <Card className="max-h-[85vh] w-full max-w-4xl overflow-auto">
      <h3 className="text-xl font-black">Preview Auto-Fix Struktur</h3>
      <p className="mt-1 text-sm text-slate-500">Auto-fix hanya memperbaiki struktur teknis. Sistem tidak membuat scoring, norma, interpretasi, code type, atau formula klinis.</p>
      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead><tr className="border-b"><th className="py-2">Path</th><th>Sebelum</th><th>Sesudah</th><th>Alasan</th></tr></thead><tbody>{result.previews.map((preview) => <tr key={`${preview.path}-${preview.reason}`} className="border-b border-slate-100 dark:border-slate-800"><td className="py-2 font-mono text-xs">{preview.path}</td><td>{JSON.stringify(preview.before)}</td><td>{JSON.stringify(preview.after)}</td><td>{preview.reason}</td></tr>)}</tbody></table></div>
      {!result.previews.length && <p className="mt-4 rounded-2xl bg-teal-50 p-4 font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-100">Tidak ada perbaikan struktur yang diperlukan.</p>}
      <div className="mt-5 flex flex-wrap gap-3"><Button disabled={!result.previews.length} onClick={onApply}>Simpan Auto-Fix</Button><Button variant="ghost" onClick={onClose}>Tutup</Button></div>
    </Card>
  </div>;
};
