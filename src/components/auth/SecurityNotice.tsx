import { LOCAL_SECURITY_WARNING } from '../../utils/userStorage';

export const SecurityNotice = () => (
  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
    <strong>Catatan keamanan:</strong> {LOCAL_SECURITY_WARNING} Hash frontend SHA-256 + salt bukan keamanan sempurna, tetapi lebih baik daripada menyimpan password polos.
  </div>
);
