import { useMemo, useState } from 'react';
import { Card, Input } from '../ui';
import { getAuditLogs } from '../../utils/auditLog';

export const AuditLogPanel = () => {
  const [query, setQuery] = useState('');
  const logs = getAuditLogs();
  const filtered = useMemo(() => logs.filter((log) => JSON.stringify(log).toLowerCase().includes(query.toLowerCase())), [logs, query]);
  return <Card><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-wide text-teal-700">Audit Logs</p><h2 className="text-2xl font-black">Riwayat aksi penting</h2><p className="text-sm text-slate-500">Login, logout, user, token, review, export, backup, restore, dan reset dicatat di riwayat sistem.</p></div><div className="w-full sm:max-w-xs"><Input placeholder="Cari log..." value={query} onChange={(event) => setQuery(event.target.value)} /></div></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b"><th className="py-3">Waktu</th><th>User</th><th>Role</th><th>Aksi</th><th>Target</th><th>Deskripsi</th></tr></thead><tbody>{filtered.map((log) => <tr key={log.logId} className="border-b border-slate-100 dark:border-slate-800"><td className="py-3 text-xs">{new Date(log.timestamp).toLocaleString('id-ID')}</td><td>{log.username}</td><td>{log.role || '-'}</td><td className="font-bold">{log.action}</td><td>{log.targetType} {log.targetId}</td><td>{log.description}</td></tr>)}</tbody></table>{filtered.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Belum ada audit log.</p>}</div></Card>;
};
