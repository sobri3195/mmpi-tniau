import { getLockdownMode } from '../../utils/lockdownMode';
export const LockdownModeBanner=()=>{const mode=getLockdownMode(); if(!mode.enabled) return null; return <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm font-bold text-rose-800">LOCKDOWN MODE AKTIF — peserta tidak boleh mulai tes baru dan import config ditahan. Alasan: {mode.reason}</div>}
