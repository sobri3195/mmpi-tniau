import type { ConfigValidationResult } from '../../utils/systemReadiness';
import { Badge, Button, Card } from '../ui';

const statusLabel = (result: ConfigValidationResult) => result.ready ? 'Siap' : result.status === 'partial' ? 'Lengkap sebagian' : result.status === 'optional' ? 'Opsional tidak digunakan' : 'Belum siap';
const tone = (result: ConfigValidationResult) => result.ready ? 'teal' : result.status === 'partial' ? 'amber' : result.status === 'optional' ? 'slate' : 'rose';

export const ConfigStatusCard = ({ result, onFix }: { result: ConfigValidationResult; onFix?: () => void }) => (
  <Card className="h-full">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{result.importKey ?? 'Konfigurasi'}</p>
        <h3 className="text-lg font-black">{result.label}</h3>
      </div>
      <Badge tone={tone(result)}>{statusLabel(result)}</Badge>
    </div>
    <div className="mt-4 space-y-2 text-sm">
      {[...result.errors, ...result.missing].slice(0, 4).map((item) => <p key={item} className="rounded-2xl bg-rose-50 p-3 text-rose-800 dark:bg-rose-950 dark:text-rose-100">{item}</p>)}
      {result.warnings.slice(0, 3).map((item) => <p key={item} className="rounded-2xl bg-amber-50 p-3 text-amber-800 dark:bg-amber-950 dark:text-amber-100">{item}</p>)}
      {result.ready && <p className="rounded-2xl bg-teal-50 p-3 font-semibold text-teal-800 dark:bg-teal-950 dark:text-teal-100">Konfigurasi lolos validasi.</p>}
    </div>
    {onFix && !result.ready && <Button className="mt-4" variant="ghost" onClick={onFix}>Buka panel perbaikan</Button>}
  </Card>
);
