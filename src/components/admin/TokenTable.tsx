import { useMemo, useState } from 'react';
import type { AccessToken, AccessTokenStatus, AssessmentResult } from '../../types';
import { Badge, Button, Card, Input, Select } from '../ui';
import { resetToken, revokeToken, saveTokens } from '../../utils/tokenAccess';
import { TokenPrintCard } from './TokenPrintCard';

const statusTone = (status: AccessTokenStatus) => status === 'completed' ? 'teal' : status === 'revoked' || status === 'expired' ? 'rose' : status === 'active' ? 'amber' : 'slate';
const mask = (token: string) => token.replace(/-([A-Z0-9]{4})-/, '-****-');
const csvEscape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;

export const TokenTable = ({ tokens, results, onChange, toast }: { tokens: AccessToken[]; results: AssessmentResult[]; onChange: () => void; toast: (message: string, tone?: 'teal' | 'amber' | 'rose') => void }) => {
  const [status, setStatus] = useState<'all' | AccessTokenStatus>('all');
  const [search, setSearch] = useState('');
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [detail, setDetail] = useState<AccessToken | null>(null);
  const [printToken, setPrintToken] = useState<AccessToken | null>(null);
  const filtered = useMemo(() => tokens.filter((token) => {
    const haystack = [token.token, token.uniqueKey, token.participantName, token.participantNumber, token.unit].join(' ').toLowerCase();
    return (status === 'all' || token.status === status) && haystack.includes(search.toLowerCase());
  }), [tokens, status, search]);
  const copy = async (value: string, label: string) => { await navigator.clipboard?.writeText(value); toast(`${label} disalin.`, 'teal'); };
  const doRevoke = (token: AccessToken) => { if (confirm(`Revoke token ${token.uniqueKey}?`)) { revokeToken(token.tokenId); onChange(); toast('Token dibatalkan admin.', 'amber'); } };
  const doReset = (token: AccessToken) => { if (confirm(`Reset token ${token.uniqueKey} ke unused?`)) { resetToken(token.tokenId); onChange(); toast('Token direset ke unused.', 'teal'); } };
  const linkResult = (token: AccessToken) => {
    const resultId = prompt('Masukkan resultId yang akan dihubungkan:', token.resultId || '');
    if (resultId === null) return;
    saveTokens(tokens.map((item) => item.tokenId === token.tokenId ? { ...item, resultId: resultId.trim() || null } : item));
    onChange();
  };
  const exportJson = () => download('mmpi-token-peserta.json', JSON.stringify(filtered, null, 2), 'application/json');
  const exportCsv = () => download('mmpi-token-peserta.csv', ['token,uniqueKey,participantName,participantNumber,unit,status,createdAt,expiresAt,startedAt,completedAt,resultId,notes', ...filtered.map((t) => [t.token, t.uniqueKey, t.participantName, t.participantNumber, t.unit, t.status, t.createdAt, t.expiresAt, t.startedAt, t.completedAt, t.resultId, t.notes].map(csvEscape).join(','))].join('\n'), 'text/csv');
  const download = (name: string, content: string, type: string) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type })); a.download = name; a.click(); URL.revokeObjectURL(a.href); };
  return <Card>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-black">Daftar Token Peserta</h2><p className="text-sm text-slate-500">Masking token aktif; gunakan Reveal untuk melihat token lengkap.</p></div><div className="flex flex-wrap gap-2"><Button variant="ghost" onClick={exportCsv}>Export CSV</Button><Button variant="ghost" onClick={exportJson}>Export JSON</Button></div></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-[220px_1fr]"><Select value={status} onChange={(e) => setStatus(e.target.value as 'all' | AccessTokenStatus)}><option value="all">Semua</option><option value="unused">Unused</option><option value="active">Active</option><option value="completed">Completed</option><option value="expired">Expired</option><option value="revoked">Revoked</option></Select><Input placeholder="Cari token, unique key, nama, nomor peserta, unit" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b"><th>Token</th><th>Unique key</th><th>Nama</th><th>Nomor</th><th>Unit</th><th>Status</th><th>Created</th><th>Expires</th><th>Started</th><th>Completed</th><th>ResultId</th><th>Aksi</th></tr>
        </thead>
        <tbody>
          {filtered.map((token) => {
            const isRevealed = Boolean(revealed[token.tokenId]);
            return (
              <tr key={token.tokenId} className="border-b align-top">
                <td className="font-mono">{isRevealed ? token.token : mask(token.token)}</td>
                <td className="font-mono">{token.uniqueKey}</td>
                <td>{token.participantName || '-'}</td>
                <td>{token.participantNumber || '-'}</td>
                <td>{token.unit || '-'}</td>
                <td><Badge tone={statusTone(token.status)}>{token.status}</Badge></td>
                <td>{new Date(token.createdAt).toLocaleDateString('id-ID')}</td>
                <td>{new Date(token.expiresAt).toLocaleString('id-ID')}</td>
                <td>{token.startedAt ? new Date(token.startedAt).toLocaleString('id-ID') : '-'}</td>
                <td>{token.completedAt ? new Date(token.completedAt).toLocaleString('id-ID') : '-'}</td>
                <td>{token.resultId || '-'}</td>
                <td>
                  <div className="flex min-w-72 flex-wrap gap-2">
                    <Button variant="ghost" onClick={() => setRevealed((prev) => ({ ...prev, [token.tokenId]: !prev[token.tokenId] }))}>Reveal</Button>
                    <Button variant="ghost" onClick={() => copy(token.token, 'Token')}>Copy token</Button>
                    <Button variant="ghost" onClick={() => copy(token.uniqueKey, 'Unique key')}>Copy key</Button>
                    <Button variant="ghost" onClick={() => setDetail(token)}>Detail</Button>
                    <Button variant="ghost" onClick={() => linkResult(token)}>Hubungkan</Button>
                    <Button variant="ghost" onClick={() => setPrintToken(token)}>Print kartu</Button>
                    <Button variant="danger" onClick={() => doRevoke(token)}>Revoke</Button>
                    <Button variant="secondary" onClick={() => doReset(token)}>Reset</Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    {detail && <div className="mt-4 rounded-2xl border p-4"><div className="flex justify-between gap-3"><h3 className="font-black">Detail Token</h3><Button variant="ghost" onClick={() => setDetail(null)}>Tutup</Button></div><pre className="mt-3 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify({ ...detail, result: results.find((r) => r.id === detail.resultId) || null }, null, 2)}</pre></div>}
    {printToken && <div className="mt-4 space-y-3"><TokenPrintCard token={printToken} /><div className="no-print flex gap-2"><Button onClick={() => window.print()}>Print kartu token</Button><Button variant="ghost" onClick={() => setPrintToken(null)}>Tutup kartu</Button></div></div>}
  </Card>;
};
