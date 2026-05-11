import { useState } from 'react';
import { Button, Card, Input } from '../ui';
import { bulkCreateTokens } from '../../utils/tokenGenerator';

export const TokenGenerator = ({ onCreated }: { onCreated: (message: string) => void }) => {
  const [form, setForm] = useState({ count: '1', tokenPrefix: 'TNI-AU', uniqueKeyPrefix: 'PESERTA-2026', expiresInDays: '7', maxAttempts: '1', participantName: '', participantNumber: '', unit: '', notes: '' });
  const set = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const create = () => {
    const created = bulkCreateTokens(Math.max(1, Number(form.count) || 1), { ...form, expiresInDays: Number(form.expiresInDays) || 7, maxAttempts: Number(form.maxAttempts) || 1 });
    onCreated(`${created.length} token peserta berhasil dibuat.`);
  };
  return <Card>
    <h2 className="text-xl font-black">Generate Token Peserta</h2>
    <div className="mt-4 grid gap-4 sm:grid-cols-3">
      <label>Jumlah token<Input type="number" min="1" value={form.count} onChange={(e) => set('count', e.target.value)} /></label>
      <label>Prefix token<Input value={form.tokenPrefix} onChange={(e) => set('tokenPrefix', e.target.value)} /></label>
      <label>Prefix unique key<Input value={form.uniqueKeyPrefix} onChange={(e) => set('uniqueKeyPrefix', e.target.value)} /></label>
      <label>Masa berlaku (hari)<Input type="number" min="1" value={form.expiresInDays} onChange={(e) => set('expiresInDays', e.target.value)} /></label>
      <label>Max attempt<Input type="number" min="1" value={form.maxAttempts} onChange={(e) => set('maxAttempts', e.target.value)} /></label>
      <label>Nama peserta opsional<Input value={form.participantName} onChange={(e) => set('participantName', e.target.value)} /></label>
      <label>Nomor peserta opsional<Input value={form.participantNumber} onChange={(e) => set('participantNumber', e.target.value)} /></label>
      <label>Unit/kesatuan opsional<Input value={form.unit} onChange={(e) => set('unit', e.target.value)} /></label>
      <label>Catatan admin<Input value={form.notes} onChange={(e) => set('notes', e.target.value)} /></label>
    </div>
    <Button className="mt-5" onClick={create}>Generate Token</Button>
  </Card>;
};
