import { useState } from 'react';
import type { ParticipantIdentity } from '../types';
import { Button, Card, Disclaimer, Input, Select } from '../components/ui';

export const IdentityPage = ({ onSubmit }: { onSubmit: (identity: ParticipantIdentity) => void }) => {
  const [form, setForm] = useState<ParticipantIdentity>({ name: '', participantNumber: '', age: '', gender: '', unit: '', assessmentDate: new Date().toISOString().slice(0, 10), consent: false });
  const valid = form.name && form.age && form.gender && form.unit && form.consent;
  const set = (key: keyof ParticipantIdentity, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Card>
        <h1 className="text-3xl font-black">Identitas Peserta</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Data tidak dikirim ke server dan hanya tersimpan pada perangkat ini.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label>Nama<Input value={form.name} onChange={(e) => set('name', e.target.value)} /></label>
          <label>Nomor peserta/NIK opsional<Input value={form.participantNumber} onChange={(e) => set('participantNumber', e.target.value)} /></label>
          <label>Usia<Input type="number" min="1" value={form.age} onChange={(e) => set('age', e.target.value)} /></label>
          <label>Jenis kelamin<Select value={form.gender} onChange={(e) => set('gender', e.target.value)}><option value="">Pilih</option><option>Laki-laki</option><option>Perempuan</option><option>Lainnya / tidak menyebutkan</option></Select></label>
          <label>Unit/instansi<Input value={form.unit} onChange={(e) => set('unit', e.target.value)} /></label>
          <label>Tanggal asesmen<Input type="date" value={form.assessmentDate} onChange={(e) => set('assessmentDate', e.target.value)} /></label>
        </div>
        <label className="mt-5 flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-800"><input type="checkbox" checked={form.consent} onChange={(e) => set('consent', e.target.checked)} />Saya memahami tujuan asesmen, penyimpanan lokal, dan bahwa hasil perlu ditinjau profesional berwenang.</label>
        <div className="mt-5"><Disclaimer /></div>
        <div className="mt-6 no-print"><Button disabled={!valid} onClick={() => onSubmit(form)}>Lanjut ke Instruksi</Button></div>
      </Card>
    </div>
  );
};
