import { useState } from 'react';
import type { ParticipantIdentity } from '../types';
import { Button, Card, Disclaimer, Input, Select } from '../components/ui';

const today = () => new Date().toISOString().slice(0, 10);
const MIN_AGE = 17;
const MAX_AGE = 80;
const DATE_MESSAGE = 'Tanggal lahir harus ditulis dalam format DD-MM-YYYY, contoh 31-07-1995.';

const formatBirthDateInput = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
};

const parseBirthDate = (value: string) => {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
  if (!match) return { valid: false, message: DATE_MESSAGE };
  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const birthDate = new Date(year, month - 1, day);
  const isValidDate = birthDate.getFullYear() === year && birthDate.getMonth() === month - 1 && birthDate.getDate() === day;
  if (!isValidDate) return { valid: false, message: DATE_MESSAGE };
  const now = new Date();
  if (birthDate.getTime() > now.getTime()) return { valid: false, message: 'Tanggal lahir tidak boleh tanggal masa depan.' };
  let age = now.getFullYear() - year;
  const monthDifference = now.getMonth() - birthDate.getMonth();
  const hasBirthdayPassed = monthDifference > 0 || (monthDifference === 0 && now.getDate() >= birthDate.getDate());
  if (!hasBirthdayPassed) age -= 1;
  if (age < MIN_AGE || age > MAX_AGE) return { valid: false, message: `Usia harus masuk akal (${MIN_AGE}–${MAX_AGE} tahun).` };
  return { valid: true, age: String(age), iso: `${yearText}-${monthText}-${dayText}`, message: '' };
};

const requiredFields: Array<keyof ParticipantIdentity> = ['name', 'dateOfBirth', 'age', 'gender', 'maritalStatus', 'education', 'occupation', 'originWorkUnit', 'unit'];

const RequiredMark = () => <span className="ml-1 text-rose-600" aria-label="wajib diisi">*</span>;

export const IdentityPage = ({ onSubmit }: { onSubmit: (identity: ParticipantIdentity) => void }) => {
  const [form, setForm] = useState<ParticipantIdentity>({
    name: '',
    participantNumber: '',
    dateOfBirth: '',
    birthDateInput: '',
    birthDateISO: '',
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
  const [birthDateError, setBirthDateError] = useState('');
  const valid = requiredFields.every((field) => Boolean(form[field])) && form.consent && !birthDateError;
  const set = (key: keyof ParticipantIdentity, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));
  const setDateOfBirth = (value: string) => {
    const formatted = formatBirthDateInput(value);
    const parsed = parseBirthDate(formatted);
    setBirthDateError(formatted.length === 10 && !parsed.valid ? parsed.message : formatted.length > 0 && formatted.length < 10 ? DATE_MESSAGE : '');
    setForm((prev) => ({
      ...prev,
      birthDateInput: formatted,
      birthDateISO: parsed.valid ? parsed.iso ?? '' : '',
      dateOfBirth: parsed.valid ? parsed.iso ?? '' : '',
      age: parsed.valid ? parsed.age ?? '' : '',
    }));
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <Card>
        <p className="text-sm font-bold uppercase tracking-wide text-teal-600">Kesehatan Jiwa TNI Angkatan Udara</p>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">Identitas Responden MMPI</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Kolom bertanda <RequiredMark /> wajib diisi. Data tidak dikirim ke server dan hanya tersimpan pada perangkat ini.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">Nama<RequiredMark /><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></label>
          <label>Nomor peserta/NIK opsional<Input value={form.participantNumber} onChange={(e) => set('participantNumber', e.target.value)} /></label>
          <label>Tanggal lahir<RequiredMark /><Input type="text" inputMode="numeric" placeholder="DD-MM-YYYY" value={form.birthDateInput ?? ''} onChange={(e) => setDateOfBirth(e.target.value)} /><span className="mt-1 block text-xs text-slate-500">Ketik manual, contoh: 31-07-1995</span>{birthDateError && <span className="mt-1 block text-xs font-bold text-rose-600">{birthDateError}</span>}{form.age && !birthDateError && <span className="mt-1 block text-sm font-bold text-teal-700">Usia: {form.age} tahun</span>}</label>
          <label>Usia<RequiredMark /><Input type="number" min={MIN_AGE} max={MAX_AGE} value={form.age} readOnly /></label>
          <label>Jenis kelamin<RequiredMark /><Select value={form.gender} onChange={(e) => set('gender', e.target.value)}><option value="">Pilih</option><option>Pria</option><option>Wanita</option></Select></label>
          <label>Status perkawinan<RequiredMark /><Select value={form.maritalStatus} onChange={(e) => set('maritalStatus', e.target.value)}><option value="">Pilih</option><option>Menikah</option><option>Belum menikah</option></Select></label>
          <label>Pendidikan<RequiredMark /><Select value={form.education} onChange={(e) => set('education', e.target.value)}><option value="">Pilih</option><option>SMA</option><option>D3</option><option>S1</option><option>S2/S3</option></Select></label>
          <label>Pekerjaan<RequiredMark /><Input value={form.occupation} onChange={(e) => set('occupation', e.target.value)} /></label>
          <label>Asal satker<RequiredMark /><Input value={form.originWorkUnit} onChange={(e) => set('originWorkUnit', e.target.value)} /></label>
          <label>Kesatuan<RequiredMark /><Input value={form.unit} onChange={(e) => set('unit', e.target.value)} /></label>
          <label>Tanggal asesmen<Input type="date" value={form.assessmentDate} onChange={(e) => set('assessmentDate', e.target.value)} /></label>
        </div>
        <label className="mt-5 flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-800"><input type="checkbox" checked={form.consent} onChange={(e) => set('consent', e.target.checked)} />Saya memahami tujuan asesmen, penyimpanan lokal, dan bahwa hasil perlu ditinjau profesional berwenang.</label>
        <div className="mt-5"><Disclaimer /></div>
        <div className="mt-6 grid no-print sm:block"><Button disabled={!valid} onClick={() => onSubmit(form)}>Lanjut ke instruksi</Button></div>
      </Card>
    </div>
  );
};
