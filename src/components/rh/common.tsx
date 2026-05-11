import type { ReactNode } from 'react';
import { Input, Select, Textarea } from '../ui';
import type { YesNo } from '../../types';
export const Field = ({ label, children }: { label: string; children: ReactNode }) => <label className="text-sm font-bold"><span>{label}</span><div className="mt-2">{children}</div></label>;
export const YesNoRadio = ({ name, value, onChange }: { name: string; value: YesNo; onChange: (value: YesNo) => void }) => <div className="flex gap-3"><label className="inline-flex items-center gap-2"><input type="radio" name={name} checked={value === 'Ya'} onChange={() => onChange('Ya')} /> Ya</label><label className="inline-flex items-center gap-2"><input type="radio" name={name} checked={value === 'Tidak'} onChange={() => onChange('Tidak')} /> Tidak</label></div>;
export { Input, Select, Textarea };
