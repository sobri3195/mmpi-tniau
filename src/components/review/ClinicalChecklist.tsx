import { useState } from 'react';
import type { ClinicalFinalizationChecklist } from '../../types';
import { Button, Card } from '../ui';
import { clinicalChecklistFields, defaultClinicalChecklist, isClinicalChecklistComplete } from './clinicalChecklistUtils';

export const ClinicalChecklist = ({ value, onChange, completedBy = '' }: { value?: ClinicalFinalizationChecklist; onChange: (next: ClinicalFinalizationChecklist) => void; completedBy?: string }) => {
  const [local, setLocal] = useState<ClinicalFinalizationChecklist>(value ?? defaultClinicalChecklist());
  const update = (key: keyof ClinicalFinalizationChecklist, checked: boolean) => {
    const next = { ...local, [key]: checked };
    if (isClinicalChecklistComplete(next)) {
      next.completedBy = completedBy;
      next.completedAt = new Date().toISOString();
    }
    setLocal(next);
    onChange(next);
  };
  return <Card><h3 className="text-xl font-black">Checklist validitas klinis wajib</h3><p className="text-sm text-slate-500">Finalisasi tidak aktif sebelum seluruh checklist lengkap.</p><div className="mt-4 grid gap-2">{clinicalChecklistFields.map(([key, label]) => <label key={key} className="flex items-start gap-3 rounded-2xl border p-3 text-sm font-semibold"><input type="checkbox" checked={Boolean(local[key])} onChange={(event) => update(key, event.target.checked)} />{label}</label>)}</div><div className="mt-4 text-sm font-bold">Status: {isClinicalChecklistComplete(local) ? 'Lengkap' : 'Belum lengkap'}</div><Button className="mt-3" variant="ghost" onClick={() => onChange(local)}>Simpan checklist</Button></Card>;
};
