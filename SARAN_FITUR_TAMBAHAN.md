# Saran Fitur Tambahan Aplikasi MMPI TNI AU/SPPG

Dokumen ini berisi usulan fitur tambahan untuk meningkatkan keamanan, keandalan operasional, kualitas telaah klinis, dan kemudahan administrasi aplikasi MMPI TNI AU/SPPG. Saran disusun dengan mempertimbangkan kondisi aplikasi saat ini yang berjalan sebagai aplikasi web statis berbasis React/Vite dan menyimpan data utama di `localStorage`.

> Catatan etik: seluruh pengembangan fitur tetap harus menjaga kepatuhan terhadap hak cipta MMPI. Aplikasi tidak boleh menyertakan soal, kunci scoring, norma, atau interpretasi resmi tanpa lisensi yang sah. Interpretasi otomatis tetap harus diposisikan sebagai alat bantu, bukan diagnosis final.

## Ringkasan Prioritas

| Prioritas | Area | Saran Utama | Dampak |
|---|---|---|---|
| P0 | Keamanan & produksi | Backend terkontrol, database terenkripsi, autentikasi server-side | Mengurangi risiko kehilangan/kebocoran data dan mendukung operasional resmi |
| P0 | Audit & kepatuhan | Audit log tersentral, riwayat perubahan konfigurasi, jejak finalisasi laporan | Memperkuat akuntabilitas klinis dan administratif |
| P1 | Validasi klinis | Workflow review multi-tahap, checklist validitas, tanda tangan digital | Menstandarkan proses telaah spesialis |
| P1 | Operasional tes | Monitoring sesi real-time, resume lintas perangkat, kontrol token lanjutan | Memudahkan operator mengelola banyak peserta |
| P2 | Pelaporan | Template laporan fleksibel, ekspor PDF server-side, lampiran audit | Meningkatkan konsistensi dan kualitas dokumen akhir |
| P2 | Integrasi | API internal, SSO, integrasi arsip/rekam medis sesuai kebijakan | Memudahkan integrasi ekosistem institusi |

## 1. Keamanan, Privasi, dan Infrastruktur Produksi

### 1.1 Backend dan Database Terenkripsi

**Saran:** tambahkan backend resmi dengan database terenkripsi untuk menyimpan akun, token, bank soal berizin, konfigurasi scoring, hasil tes, RH Skrining, review spesialis, dan audit log.

**Manfaat:**

- Data tidak bergantung pada browser/perangkat tunggal.
- Backup, restore, dan sinkronisasi menjadi lebih terkendali.
- Hak akses dapat ditegakkan di server, bukan hanya di frontend.
- Mendukung penggunaan resmi multi-operator dan multi-lokasi.

**Catatan implementasi:**

- Gunakan enkripsi at-rest dan in-transit.
- Terapkan pemisahan data sensitif, misalnya identitas peserta dan hasil psikologis.
- Terapkan kebijakan retensi data sesuai aturan institusi.

### 1.2 Autentikasi Server-Side dan Multi-Factor Authentication

**Saran:** gunakan autentikasi server-side untuk admin, operator, dan spesialis, dilengkapi MFA untuk role berisiko tinggi seperti superadmin.

**Manfaat:**

- Mengurangi risiko akun diakses dari perangkat yang tidak sah.
- Memudahkan pencabutan akses saat personel berpindah tugas.
- Memperkuat keamanan saat aplikasi dipakai di jaringan produksi.

### 1.3 Role-Based Access Control Lanjutan

**Saran:** perluas RBAC menjadi lebih granular, misalnya permission per unit, per gelombang tes, per jenis laporan, dan per tahap finalisasi.

**Contoh permission tambahan:**

- `results:view_own_unit`
- `results:export_pdf`
- `review:first_level`
- `review:final_approval`
- `config:publish_version`
- `audit:view_sensitive`

## 2. Audit, Kepatuhan, dan Tata Kelola Konfigurasi

### 2.1 Audit Log Tersentral dan Tidak Mudah Diubah

**Saran:** simpan audit log di backend dengan proteksi terhadap perubahan manual.

**Aktivitas yang perlu dicatat:**

- Login dan logout pengguna.
- Pembuatan, penggunaan, pembatalan, dan kedaluwarsa token.
- Impor bank soal, scoring, norma, dan interpretasi.
- Perubahan pengaturan institusi dan template laporan.
- Pembukaan, ekspor, revisi, dan finalisasi laporan.
- Backup, restore, dan penghapusan data.

### 2.2 Versioning Konfigurasi Scoring dan Norma

**Saran:** setiap konfigurasi scoring, norma, interpretasi, dan analisa ringkas memiliki versi, status, pembuat, reviewer, tanggal aktif, serta changelog.

**Manfaat:**

- Hasil tes dapat ditelusuri menggunakan konfigurasi versi mana.
- Memudahkan rollback jika terjadi kesalahan impor.
- Mencegah konfigurasi draft dipakai untuk keputusan resmi.

### 2.3 Mode Validasi Sebelum Publikasi Konfigurasi

**Saran:** tambahkan fitur validasi otomatis sebelum konfigurasi scoring/norma dipublikasikan.

**Validasi yang disarankan:**

- Kesesuaian jumlah item dengan bank soal.
- Deteksi item ganda dalam satu skala.
- Deteksi skala tanpa rule interpretasi.
- Deteksi norma tidak lengkap atau rentang skor tidak konsisten.
- Pemeriksaan metadata lisensi/sumber dokumen.

## 3. Peningkatan Alur Tes Peserta

### 3.1 Monitoring Sesi Real-Time untuk Operator

**Saran:** tambahkan dashboard pemantauan sesi peserta secara real-time.

**Informasi yang ditampilkan:**

- Status belum mulai, sedang mengerjakan, selesai MMPI, selesai RH, menunggu review.
- Persentase progres jawaban.
- Waktu mulai, durasi berjalan, dan waktu selesai.
- Indikator sesi terputus atau idle terlalu lama.
- Daftar peserta yang memerlukan bantuan operator.

### 3.2 Resume Lintas Perangkat Secara Aman

**Saran:** jika backend sudah tersedia, peserta dapat melanjutkan tes pada perangkat lain menggunakan token yang sama dengan kontrol keamanan.

**Kontrol yang disarankan:**

- Token hanya aktif untuk satu sesi pada satu waktu.
- Resume membutuhkan verifikasi identitas dasar.
- Riwayat perpindahan perangkat dicatat di audit log.

### 3.3 Kontrol Token Lanjutan

**Saran:** tambahkan pengaturan token yang lebih detail.

**Contoh fitur:**

- Masa berlaku token per gelombang.
- Pembatasan IP/lokasi jaringan bila diperlukan.
- Token sekali pakai atau token multi-tahap.
- Pembatalan massal token yang belum dipakai.
- Cetak kartu token batch dengan QR code.

### 3.4 Fitur Aksesibilitas Peserta

**Saran:** tambahkan opsi aksesibilitas tanpa mengubah substansi item.

**Contoh fitur:**

- Mode font besar.
- Kontras tinggi.
- Navigasi keyboard yang lebih jelas.
- Indikator jawaban belum lengkap.
- Konfirmasi sebelum submit final.

## 4. Review Klinis dan Finalisasi Laporan

### 4.1 Workflow Review Bertingkat

**Saran:** tambahkan alur review bertingkat, misalnya operator verifikasi data, spesialis review klinis, dan pejabat berwenang final approval bila dibutuhkan.

**Status yang disarankan:**

1. `draft_result`
2. `awaiting_operator_verification`
3. `awaiting_specialist_review`
4. `needs_revision`
5. `finalized`
6. `archived`

### 4.2 Checklist Validitas Klinis

**Saran:** tambahkan checklist sebelum spesialis finalisasi laporan.

**Contoh checklist:**

- Identitas peserta sudah sesuai.
- Jumlah jawaban lengkap.
- Skala validitas telah ditinjau.
- Pola inkonsistensi atau red flag sudah diberi catatan.
- RH Skrining sudah dibandingkan dengan profil MMPI.
- Kesimpulan tidak hanya mengandalkan interpretasi otomatis.

### 4.3 Tanda Tangan Digital dan Jejak Persetujuan

**Saran:** tambahkan tanda tangan digital internal untuk spesialis atau pejabat berwenang.

**Manfaat:**

- Laporan final lebih mudah diverifikasi.
- Mengurangi risiko perubahan setelah finalisasi.
- Mendukung arsip resmi dan pemeriksaan audit.

## 5. Pelaporan dan Ekspor Dokumen

### 5.1 Template Laporan yang Dapat Dikonfigurasi

**Saran:** sediakan editor template laporan berbasis komponen yang dapat diaktifkan/nonaktifkan oleh admin.

**Komponen opsional:**

- Identitas institusi.
- Ringkasan hasil.
- Grafik profil.
- Tabel skor.
- Interpretasi skala.
- RH Skrining dan red flag.
- Catatan spesialis.
- Kesimpulan dan rekomendasi.
- Lampiran audit/finalisasi.

### 5.2 Ekspor PDF Server-Side

**Saran:** untuk produksi, gunakan pembuatan PDF server-side agar format laporan konsisten di semua perangkat.

**Manfaat:**

- Menghindari perbedaan hasil cetak antar-browser.
- Memudahkan pemberian nomor dokumen dan watermark.
- Mendukung arsip otomatis.

### 5.3 Paket Ekspor Arsip

**Saran:** buat fitur ekspor arsip per peserta atau per gelombang dalam format terstruktur.

**Isi paket arsip:**

- Laporan PDF final.
- Data hasil terstruktur JSON/CSV.
- Metadata konfigurasi yang digunakan.
- Audit trail finalisasi.
- Ringkasan RH Skrining.

## 6. Analitik Operasional

### 6.1 Dashboard Statistik Pelaksanaan

**Saran:** tambahkan dashboard statistik untuk pimpinan/operator tanpa membuka detail klinis yang tidak diperlukan.

**Metrik yang disarankan:**

- Jumlah peserta per gelombang.
- Tingkat penyelesaian tes.
- Rata-rata durasi pengerjaan.
- Jumlah peserta menunggu review.
- Jumlah laporan final.
- Jumlah token aktif, terpakai, dan kedaluwarsa.

### 6.2 Deteksi Anomali Operasional

**Saran:** tambahkan peringatan untuk pola operasional yang tidak biasa.

**Contoh anomali:**

- Durasi pengerjaan terlalu cepat atau terlalu lama.
- Banyak jawaban kosong sebelum submit.
- Banyak sesi gagal dari perangkat yang sama.
- Perubahan konfigurasi menjelang pelaksanaan tes.

## 7. Integrasi Sistem

### 7.1 API Internal Terbatas

**Saran:** jika backend sudah tersedia, sediakan API internal dengan dokumentasi dan audit.

**Use case:**

- Sinkronisasi daftar peserta dari sistem personel.
- Pengiriman status finalisasi ke sistem arsip.
- Penarikan metadata unit/golongan/pangkat dari master data institusi.

### 7.2 Single Sign-On

**Saran:** integrasikan login admin/operator/spesialis dengan SSO institusi bila tersedia.

**Manfaat:**

- Manajemen akun lebih mudah.
- Akses mengikuti status personel aktif/nonaktif.
- Kebijakan password dan MFA mengikuti standar institusi.

## 8. Backup, Restore, dan Disaster Recovery

### 8.1 Backup Terjadwal

**Saran:** tambahkan backup otomatis terjadwal ke lokasi penyimpanan yang disetujui institusi.

**Ketentuan yang disarankan:**

- Backup terenkripsi.
- Retensi harian, mingguan, dan bulanan.
- Uji restore berkala.
- Log hasil backup dan kegagalan backup.

### 8.2 Mode Pemulihan Insiden

**Saran:** buat prosedur dan fitur pemulihan saat terjadi kegagalan sistem, salah impor konfigurasi, atau kehilangan data.

**Contoh fitur:**

- Snapshot sebelum impor konfigurasi.
- Restore per gelombang tes.
- Lockdown mode saat insiden keamanan.
- Laporan insiden otomatis untuk admin.

## 9. Rencana Implementasi Bertahap

### Tahap 1 — Fondasi Produksi

- Backend dan database terenkripsi.
- Autentikasi server-side.
- Audit log tersentral.
- Versioning konfigurasi.
- Backup dan restore dasar.

### Tahap 2 — Operasional dan Review Klinis

- Monitoring sesi real-time.
- Workflow review bertingkat.
- Checklist validitas klinis.
- Kontrol token lanjutan.
- Template laporan yang dapat dikonfigurasi.

### Tahap 3 — Integrasi dan Optimasi

- Ekspor PDF server-side.
- API internal.
- SSO institusi.
- Dashboard statistik.
- Deteksi anomali operasional.

## 10. Kriteria Keberhasilan

Fitur tambahan dianggap berhasil jika memenuhi indikator berikut:

- Data peserta tidak hilang saat browser/perangkat diganti.
- Setiap hasil tes dapat ditelusuri ke versi konfigurasi yang digunakan.
- Setiap perubahan penting memiliki audit trail yang jelas.
- Operator dapat memantau progres peserta secara efisien.
- Spesialis memiliki alur review dan finalisasi yang terdokumentasi.
- Laporan final konsisten, dapat diverifikasi, dan tidak berubah setelah finalisasi.
- Backup dapat dipulihkan melalui uji restore berkala.
