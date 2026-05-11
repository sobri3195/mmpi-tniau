import type { ConfigValidationResult } from '../../utils/systemReadiness';
import { Badge, Card } from '../ui';

export const ConfigValidationDetail = ({ result }: { result: ConfigValidationResult }) => (
  <Card>
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-lg font-black">Detail Validasi — {result.label}</h3>
      <Badge tone={result.ready ? 'teal' : result.status === 'partial' ? 'amber' : 'rose'}>{result.ready ? 'Siap' : result.status === 'partial' ? 'Lengkap sebagian' : 'Belum siap'}</Badge>
    </div>
    <div className="mt-4 grid gap-4 md:grid-cols-3">
      <div><p className="font-bold">Error</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{result.errors.length ? result.errors.map((item) => <li key={item}>{item}</li>) : <li>Tidak ada error.</li>}</ul></div>
      <div><p className="font-bold">Kurang</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{result.missing.length ? result.missing.map((item) => <li key={item}>{item}</li>) : <li>Tidak ada item kurang.</li>}</ul></div>
      <div><p className="font-bold">Catatan</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{[...result.warnings, ...result.details].length ? [...result.warnings, ...result.details].map((item) => <li key={item}>{item}</li>) : <li>Tidak ada catatan.</li>}</ul></div>
    </div>
  </Card>
);
