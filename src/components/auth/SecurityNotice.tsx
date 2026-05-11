import { AlertBox } from '../admin/AdminCommon';

export const SecurityNotice = () => (
  <AlertBox tone="amber">
    Data user, token, dan hasil asesmen tersimpan di localStorage perangkat ini. Untuk keamanan institusional, gunakan backend, database terenkripsi, autentikasi resmi, dan audit server.
  </AlertBox>
);

export const LocalAuthDisclaimer = () => (
  <AlertBox tone="rose">
    Multiakses berbasis localStorage bukan autentikasi server-level. Untuk penggunaan institusional resmi, gunakan backend, database, enkripsi, audit server, dan autentikasi profesional.
  </AlertBox>
);
