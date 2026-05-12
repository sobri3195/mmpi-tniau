import { useEffect, useState } from 'react';
import type { AccessToken, AssessmentResult } from '../../types';
import { Card } from '../ui';
import { StatCard } from './AdminCommon';
import { TokenGenerator } from './TokenGenerator';
import { TokenTable } from './TokenTable';
import { createAccessToken, ensureUniqueGeneratedToken, generateUniqueKey } from '../../utils/tokenGenerator';
import { expireOldTokens, loadTokens, saveTokens } from '../../utils/tokenAccess';

const parseCsv = (text: string) => {
  const [head = '', ...rows] = text.trim().split(/\r?\n/);
  const headers = head.split(',').map((h) => h.trim());
  return rows.filter(Boolean).map((row) => {
    const values = row.match(/("(?:""|[^"])*"|[^,]*)/g)?.filter((_, i) => i % 2 === 0).map((v) => v.replace(/^"|"$/g, '').replaceAll('""', '"')) || [];
    return Object.fromEntries(headers.map((h, i) => [h, values[i] || '']));
  });
};

export const TokenManagementPanel = ({ results, toast }: { results: AssessmentResult[]; toast: (message: string, tone?: 'teal' | 'amber' | 'rose') => void }) => {
  const [tokens, setTokens] = useState<AccessToken[]>(() => expireOldTokens());
  const refresh = () => setTokens(expireOldTokens());
  useEffect(() => { refresh(); }, []);
  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      const text = await file.text();
      const incoming = file.name.toLowerCase().endsWith('.json') ? JSON.parse(text) : parseCsv(text);
      if (!Array.isArray(incoming)) throw new Error('Format import harus array JSON atau CSV ber-header.');
      const existing = loadTokens();
      const tokenValues = new Set(existing.map((item) => item.token.toUpperCase()));
      const uniqueKeys = new Set(existing.map((item) => item.uniqueKey.toUpperCase()));
      const nextTokens: AccessToken[] = [];
      incoming.forEach((row, index) => {
        const token = String(row.token || ensureUniqueGeneratedToken('TNI-AU')).toUpperCase().trim();
        const uniqueKey = String(row.uniqueKey || generateUniqueKey('PESERTA-2026', uniqueKeys.size + index + 1)).toUpperCase().trim();
        if (tokenValues.has(token)) throw new Error(`Duplikat token: ${token}`);
        if (uniqueKeys.has(uniqueKey)) throw new Error(`Duplikat unique key: ${uniqueKey}`);
        tokenValues.add(token); uniqueKeys.add(uniqueKey);
        nextTokens.push(createAccessToken({ token, uniqueKey, participantName: row.participantName, participantNumber: row.participantNumber, unit: row.unit, expiresAt: row.expiresAt, maxAttempts: Number(row.maxAttempts) || 1, notes: row.notes }));
      });
      saveTokens([...nextTokens, ...existing]);
      refresh();
      toast(`${nextTokens.length} token berhasil diimpor.`, 'teal');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Impor token gagal.', 'rose');
    }
  };
  const counts = tokens.reduce<Record<string, number>>((acc, token) => ({ ...acc, [token.status]: (acc[token.status] || 0) + 1 }), {});
  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><StatCard label="Total token" value={tokens.length} /><StatCard label="Unused" value={counts.unused || 0} /><StatCard label="Active" value={counts.active || 0} tone="amber" /><StatCard label="Completed" value={counts.completed || 0} tone="teal" /><StatCard label="Revoked/Expired" value={(counts.revoked || 0) + (counts.expired || 0)} tone="rose" /></div>
    <TokenGenerator onCreated={(message) => { refresh(); toast(message, 'teal'); }} />
    <Card><h2 className="text-xl font-black">Impor token CSV/JSON</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">CSV mendukung kolom: token, uniqueKey, participantName, participantNumber, unit, expiresAt, maxAttempts, notes. Token/uniqueKey kosong akan dibuat otomatis; duplikat akan ditolak.</p><label className="mt-4 inline-flex cursor-pointer rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white dark:bg-slate-100 dark:text-slate-900">Pilih file CSV/JSON<input className="hidden" type="file" accept=".csv,.json" onChange={(e) => importFile(e.target.files?.[0])} /></label></Card>
    <TokenTable tokens={tokens} results={results} onChange={refresh} toast={toast} />
  </div>;
};
