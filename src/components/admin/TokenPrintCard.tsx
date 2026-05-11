import type { AccessToken } from '../../types';

export const TokenPrintCard = ({ token }: { token: AccessToken }) => (
  <div className="print-card rounded-3xl border-2 border-slate-300 bg-white p-6 text-slate-950 shadow-sm">
    <h2 className="text-2xl font-black">Akses Tes MMPI TNI AU</h2>
    <div className="mt-4 grid gap-3 text-sm">
      <div><span className="font-bold">Token akses:</span><div className="font-mono text-xl font-black tracking-wider">{token.token}</div></div>
      <div><span className="font-bold">Unique key:</span><div className="font-mono text-lg font-black">{token.uniqueKey}</div></div>
      {token.participantName && <p><strong>Nama:</strong> {token.participantName}</p>}
      {token.participantNumber && <p><strong>Nomor peserta:</strong> {token.participantNumber}</p>}
      <p><strong>Masa berlaku:</strong> {new Date(token.expiresAt).toLocaleString('id-ID')}</p>
    </div>
    <ol className="mt-5 list-decimal space-y-1 pl-5 text-sm font-semibold">
      <li>Buka website asesmen.</li>
      <li>Klik Mulai Tes.</li>
      <li>Masukkan Token dan Unique Key.</li>
      <li>Jawab seluruh soal sampai selesai.</li>
      <li>Jangan membagikan token ke orang lain.</li>
    </ol>
  </div>
);
