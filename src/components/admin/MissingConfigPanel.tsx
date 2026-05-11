import type { MissingConfigItem } from '../../utils/systemReadiness';
import { Button, Card } from '../ui';

export const MissingConfigPanel = ({ items, onImport }: { items: MissingConfigItem[]; onImport: () => void }) => (
  <Card>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-xl font-black">Config yang harus dilengkapi</h3>
        <p className="text-sm text-slate-500">Panel ini menunjukkan file yang perlu diimpor admin dan skala/bagian yang belum lengkap.</p>
      </div>
      <Button variant="secondary" onClick={onImport}>Import Config yang Kurang</Button>
    </div>
    <div className="mt-4 grid gap-3">
      {items.length === 0 ? <p className="rounded-2xl bg-teal-50 p-4 font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-100">Tidak ada config yang kurang.</p> : items.map((item) => (
        <article key={`${item.label}-${item.storageKey}`} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
          <p className="font-black">{item.label}</p>
          <p className="mt-1 text-sm text-slate-500">LocalStorage/File target: {item.storageKey}</p>
          <p className="mt-2 text-sm font-semibold">{item.action}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{item.missing.slice(0, 12).map((missing) => <li key={missing}>{missing}</li>)}</ul>
        </article>
      ))}
    </div>
  </Card>
);
