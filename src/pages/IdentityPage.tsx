import { useState } from 'react';
import type { ParticipantIdentity } from '../types';
import { Button, Card, Disclaimer, Input, Select } from '../components/ui';

const today = () => new Date().toISOString().slice(0, 10);

const calculateAge = (dateOfBirth: string) => {
  if (!dateOfBirth) return '';
  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return '';

  const currentDate = new Date();
  let age = currentDate.getFullYear() - birthDate.getFullYear();
  const monthDifference = currentDate.getMonth() - birthDate.getMonth();
  const hasBirthdayPassed = monthDifference > 0 || (monthDifference === 0 && currentDate.getDate() >= birthDate.getDate());
  if (!hasBirthdayPassed) age -= 1;

  return age >= 0 ? String(age) : '';
};

const requiredFields: Array<keyof ParticipantIdentity> = ['name', 'dateOfBirth', 'age', 'gender', 'maritalStatus', 'education', 'occupation', 'originWorkUnit', 'unit'];

const RequiredMark = () => <span className="ml-1 text-rose-600" aria-label="wajib diisi">*</span>;

export const IdentityPage = ({ onSubmit }: { onSubmit: (identity: ParticipantIdentity) => void }) => {
  const [form, setForm] = useState<ParticipantIdentity>({
    name: '',
    participantNumber: '',
    dateOfBirth: '',
    age: '',
    gender: '',
    maritalStatus: '',
    education: '',
    occupation: '',
    originWorkUnit: '',
    unit: '',
    assessmentDate: today(),
    consent: false,
  });
  const valid = requiredFields.every((field) => Boolean(form[field])) && form.consent;
  const set = (key: keyof ParticipantIdentity, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));
  const setDateOfBirth = (value: string) => setForm((prev) => ({ ...prev, dateOfBirth: value, age: calculateAge(value) }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <Card>
        <p className="text-sm font-bold uppercase tracking-wide text-teal-600">Kesehatan Jiwa TNI Angkatan Udara</p>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">Identitas Responden MMPI</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Kolom bertanda <RequiredMark /> wajib diisi. Data tidak dikirim ke server dan hanya tersimpan pada perangkat ini.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">Nama<RequiredMark /><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></label>
          <label>Nomor peserta/NIK opsional<Input value={form.participantNumber} onChange={(e) => set('participantNumber', e.target.value)} /></label>
          <label>Tanggal lahir<RequiredMark /><Input type="date" value={form.dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} /></label>
          <label>Usia<RequiredMark /><Input type="number" min="1" value={form.age} onChange={(e) => set('age', e.target.value)} /></label>
          <label>Jenis kelamin<RequiredMark /><Select value={form.gender} onChange={(e) => set('gender', e.target.value)}><option value="">Pilih</option><option>Pria</option><option>Wanita</option></Select></label>
          <label>Status perkawinan<RequiredMark /><Select value={form.maritalStatus} onChange={(e) => set('maritalStatus', e.target.value)}><option value="">Pilih</option><option>Menikah</option><option>Belum Menikah</option></Select></label>
          <label>Pendidikan<RequiredMark /><Select value={form.education} onChange={(e) => set('education', e.target.value)}><option value="">Pilih</option><option>SMA</option><option>D3</option><option>S1</option><option>S2/S3</option></Select></label>
          <label>Pekerjaan<RequiredMark /><Input value={form.occupation} onChange={(e) => set('occupation', e.target.value)} /></label>
          <label>Asal Satker<RequiredMark /><Input value={form.originWorkUnit} onChange={(e) => set('originWorkUnit', e.target.value)} /></label>
          <label>Kesatuan<RequiredMark /><Input value={form.unit} onChange={(e) => set('unit', e.target.value)} /></label>
          <label>Tanggal asesmen<Input type="date" value={form.assessmentDate} onChange={(e) => set('assessmentDate', e.target.value)} /></label>
        </div>
        <label className="mt-5 flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-800"><input type="checkbox" checked={form.consent} onChange={(e) => set('consent', e.target.checked)} />Saya memahami tujuan asesmen, penyimpanan lokal, dan bahwa hasil perlu ditinjau profesional berwenang.</label>
        <div className="mt-5"><Disclaimer /></div>
        <div className="mt-6 grid no-print sm:block"><Button disabled={!valid} onClick={() => onSubmit(form)}>Lanjut ke Instruksi</Button></div>
      </Card>
    </div>
  );
};
