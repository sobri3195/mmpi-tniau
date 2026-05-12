# Prompt Keseluruhan: Membangun Aplikasi Asesmen MMPI TNI AU/SPPG dari Awal

Gunakan dokumen ini sebagai prompt utama untuk meminta AI/developer membangun ulang aplikasi asesmen MMPI TNI AU/SPPG dari nol secara bertahap, aman, dan siap dikembangkan ke produksi.

> **Catatan etik dan legal wajib:** jangan menyalin, mengarang, atau menyertakan butir soal MMPI asli, kunci scoring, norma, interpretasi resmi, atau materi berlisensi lain tanpa izin tertulis yang sah. Semua contoh data harus berupa placeholder/dummy. Interpretasi otomatis hanya boleh menjadi alat bantu skrining internal dan wajib ditinjau oleh psikolog, psikiater, atau tenaga profesional berwenang.

---

## Prompt Utama

Saya ingin Anda membangun dari awal sebuah aplikasi web bernama **Asesmen MMPI TNI AU/SPPG**.

Aplikasi ini digunakan untuk membantu alur administrasi asesmen psikologi berbasis MMPI, mulai dari pengisian identitas peserta, instruksi tes, pengerjaan item, pengisian RH Skrining, scoring berbasis konfigurasi resmi/berizin, dashboard admin, review spesialis, sampai laporan akhir. Aplikasi harus dibuat dengan prinsip aman, modular, mudah diaudit, dan tidak melanggar hak cipta MMPI.

Bangun aplikasi dengan stack berikut:

- **Frontend:** React + Vite + TypeScript.
- **Styling:** Tailwind CSS.
- **Chart:** Recharts atau library chart React yang stabil.
- **Testing:** Vitest + React Testing Library.
- **Linting:** ESLint untuk TypeScript/React.
- **Penyimpanan tahap awal:** `localStorage` browser untuk prototipe/offline single-device.
- **Arsitektur harus siap migrasi backend:** pisahkan layer storage/service supaya nanti bisa diganti API/database tanpa mengubah UI besar-besaran.

Buat aplikasi sebagai sistem yang bersih, bertahap, dan terdokumentasi. Jangan membuat fitur asal jadi; setiap fitur harus memiliki struktur data, validasi, dan pesan error yang jelas.

---

## Tujuan Produk

Buat aplikasi yang mampu:

1. Menampilkan landing page institusional untuk aplikasi asesmen MMPI TNI AU/SPPG.
2. Mengelola akses peserta menggunakan token atau alur akses yang dapat dikontrol admin.
3. Mengumpulkan identitas peserta dan data pendukung yang relevan untuk administrasi asesmen.
4. Menampilkan instruksi tes sebelum peserta mulai.
5. Menyajikan daftar item tes dari bank soal yang diimpor admin, bukan hardcoded.
6. Menyimpan progres pengerjaan secara otomatis.
7. Melakukan scoring berdasarkan konfigurasi scoring resmi/berizin yang diimpor admin.
8. Menampilkan hasil raw score, T-score bila norma tersedia, grafik profil, dan interpretasi berbasis konfigurasi.
9. Menyediakan RH Skrining sebagai formulir tambahan untuk riwayat hidup/skrining psikososial.
10. Menyediakan dashboard admin untuk mengelola bank soal, scoring config, token, hasil, backup/restore, dan audit sederhana.
11. Menyediakan workflow review spesialis sebelum laporan final dipakai.
12. Menyediakan ekspor data JSON/CSV dan cetak laporan melalui print browser untuk tahap awal.
13. Menyiapkan dokumentasi teknis, SOP penggunaan, quality check, dan rencana migrasi backend.

---

## Batasan Wajib

Pastikan aplikasi mematuhi batasan berikut:

- Jangan memasukkan item MMPI asli di repository.
- Jangan memasukkan kunci scoring, norma, atau interpretasi resmi tanpa lisensi.
- Gunakan data dummy seperti `Contoh item placeholder` untuk sample.
- Semua konfigurasi scoring harus berbasis import JSON/CSV dari admin.
- Jangan hardcode rahasia, password permanen, kunci scoring, atau data peserta sensitif.
- Untuk prototipe localStorage, beri peringatan bahwa data berada di browser/perangkat pengguna.
- Untuk penggunaan resmi/produksi, rekomendasikan backend, database terenkripsi, audit log server-side, dan kontrol akses server-side.
- Hasil otomatis tidak boleh disebut diagnosis final.
- Laporan final harus menyertakan ruang catatan/review spesialis.

---

## Role dan Hak Akses

Implementasikan role minimal:

1. **Peserta**
   - Mengakses tes menggunakan token/tautan yang valid.
   - Mengisi identitas.
   - Membaca instruksi.
   - Mengerjakan MMPI.
   - Mengisi RH Skrining bila diwajibkan.
   - Mengirim hasil.

2. **Admin/Operator**
   - Login ke dashboard admin.
   - Mengimpor bank soal dummy/resmi berizin.
   - Mengimpor scoring config resmi/berizin.
   - Mengelola token peserta.
   - Melihat status sesi.
   - Melakukan backup/restore data lokal.
   - Mengekspor hasil.
   - Mengelola user/role pada prototipe.

3. **Spesialis/Reviewer**
   - Melihat hasil yang menunggu review.
   - Membaca profil skor, grafik, validitas, RH Skrining, dan catatan red flag.
   - Mengisi checklist review klinis.
   - Menambahkan catatan, kesimpulan, dan rekomendasi.
   - Menandatangani/finalisasi laporan secara internal pada prototipe.

4. **Superadmin**
   - Mengatur konfigurasi aplikasi.
   - Mengelola role dan permission.
   - Melihat audit log.
   - Melakukan reset/restore dengan konfirmasi ketat.

Gunakan permission granular seperti:

- `questions:import`
- `scoring:import`
- `tokens:create`
- `sessions:view`
- `results:view`
- `results:export`
- `review:write`
- `review:finalize`
- `audit:view`
- `settings:manage`

---

## Struktur Halaman

Buat halaman minimal berikut:

1. `/` — Landing page
   - Branding aplikasi.
   - Penjelasan singkat fungsi aplikasi.
   - Tombol masuk peserta.
   - Tombol login admin.
   - Catatan privasi dan etika.

2. `/access` — Akses token peserta
   - Input token.
   - Validasi token aktif/kedaluwarsa/sudah dipakai.
   - Pesan error jelas.

3. `/identity` — Identitas peserta
   - Nama/inisial sesuai kebijakan.
   - Nomor peserta.
   - Pangkat/jabatan/satuan bila relevan.
   - Tanggal lahir/usia.
   - Jenis kelamin.
   - Gelombang/periode tes.
   - Persetujuan penggunaan data sesuai kebijakan internal.

4. `/instructions` — Instruksi tes
   - Instruksi umum.
   - Estimasi waktu.
   - Peringatan untuk menjawab jujur.
   - Tombol mulai tes.

5. `/test` — Pengerjaan tes
   - Menampilkan satu item atau beberapa item per halaman.
   - Navigasi item.
   - Progress bar.
   - Validasi jawaban wajib.
   - Autosave progres.
   - Resume dari localStorage.
   - Konfirmasi sebelum submit final.

6. `/rh-screening` — RH Skrining
   - Data keluarga.
   - Riwayat pendidikan.
   - Riwayat kesehatan.
   - Riwayat psikologis/psikiatris bila relevan.
   - Riwayat sosial dan pekerjaan.
   - Red flag otomatis berbasis jawaban skrining.

7. `/results/:id` — Hasil dan laporan
   - Identitas peserta.
   - Ringkasan skor.
   - Grafik profil.
   - Tabel skor.
   - Interpretasi berbasis konfigurasi.
   - Validity indicators.
   - RH Skrining dan red flags.
   - Catatan reviewer.
   - Tombol cetak/ekspor.

8. `/admin/login` — Login admin
   - Login sederhana untuk prototipe.
   - Hash password bila disimpan lokal.
   - Peringatan bahwa produksi harus memakai backend auth.

9. `/admin` — Dashboard admin
   - Ringkasan jumlah sesi, token, hasil, review pending.
   - Shortcut ke modul admin.

10. `/admin/questions` — Import bank soal
    - Import JSON/CSV.
    - Validasi format.
    - Preview jumlah item.
    - Tidak boleh ada soal asli dalam sample repository.

11. `/admin/scoring` — Import scoring config
    - Import JSON.
    - Validasi skala, item, range interpretasi, norma.
    - Preview konfigurasi.
    - Versioning sederhana.

12. `/admin/tokens` — Kelola token
    - Buat token tunggal/batch.
    - Masa berlaku.
    - Status token.
    - Revoke token.

13. `/admin/sessions` — Monitoring sesi
    - Status belum mulai, berjalan, selesai, menunggu review.
    - Progress jawaban.
    - Waktu mulai/selesai.

14. `/admin/review` — Review spesialis
    - Daftar hasil menunggu review.
    - Form checklist.
    - Catatan spesialis.
    - Finalisasi laporan.

15. `/admin/audit` — Audit log prototipe
    - Daftar aktivitas penting.
    - Filter tanggal/jenis aktivitas.

16. `/admin/backup` — Backup/restore
    - Export semua data localStorage ke JSON.
    - Import restore JSON dengan konfirmasi.
    - Validasi schema sederhana.

---

## Model Data Minimal

Buat TypeScript types/interfaces untuk data berikut.

### Question

```ts
export interface Question {
  id: number;
  code: string;
  text: string;
  responseType: 'true_false' | 'yes_no';
  options: Array<{ label: string; value: boolean }>;
  required: boolean;
}
```

### Scoring Config

```ts
export interface ScoringConfig {
  instrumentName: string;
  version: string;
  source?: string;
  licenseNote?: string;
  createdAt: string;
  scales: ScaleConfig[];
}

export interface ScaleConfig {
  id: string;
  name: string;
  description?: string;
  type: 'validity' | 'clinical' | 'content' | 'supplementary' | 'custom';
  items: Array<{
    questionId: number;
    scoredResponse: boolean;
    point: number;
  }>;
  interpretationRules: Array<{
    min: number;
    max: number;
    label: string;
    description: string;
  }>;
  norms?: Array<{
    raw: number;
    tScore: number;
  }>;
}
```

### Participant Session

```ts
export interface ParticipantSession {
  id: string;
  tokenId?: string;
  identity: ParticipantIdentity;
  answers: Record<number, boolean>;
  rhScreening?: RHScreening;
  status: 'identity' | 'instructions' | 'testing' | 'rh_screening' | 'submitted' | 'reviewed' | 'finalized';
  startedAt: string;
  updatedAt: string;
  submittedAt?: string;
}
```

### Result

```ts
export interface AssessmentResult {
  id: string;
  sessionId: string;
  identity: ParticipantIdentity;
  scoringConfigVersion: string;
  scaleResults: ScaleResult[];
  rhScreening?: RHScreening;
  review?: SpecialistReview;
  status: 'draft_result' | 'awaiting_review' | 'needs_revision' | 'finalized' | 'archived';
  createdAt: string;
  finalizedAt?: string;
}
```

---

## LocalStorage Keys

Gunakan key yang konsisten:

- `sppg_mmpi_questions`
- `sppg_mmpi_scoring_config`
- `sppg_mmpi_current_session`
- `sppg_mmpi_results`
- `sppg_mmpi_tokens`
- `sppg_mmpi_users`
- `sppg_mmpi_audit_log`
- `sppg_mmpi_admin_settings`

Buat wrapper storage service agar semua baca/tulis localStorage melewati satu layer, misalnya `src/services/storage.ts` atau `src/utils/storage.ts`.

---

## Scoring dan Interpretasi

Implementasikan scoring dengan aturan:

1. Ambil jawaban peserta.
2. Untuk setiap skala, cocokkan `questionId` dan `scoredResponse`.
3. Tambahkan `point` bila jawaban sesuai.
4. Hitung raw score.
5. Bila `norms` tersedia, konversi raw score ke T-score.
6. Cari interpretasi berdasarkan raw score atau T-score sesuai metadata konfigurasi.
7. Jika norma tidak tersedia, tampilkan keterangan: `Belum dikonversi ke norma resmi`.
8. Jangan buat interpretasi klinis sembarangan; semua teks interpretasi berasal dari file konfigurasi yang diimpor.

Buat unit test untuk:

- Scoring raw score.
- Konversi T-score.
- Jawaban kosong.
- Konfigurasi item tidak ditemukan.
- Range interpretasi overlap/tidak valid.

---

## Validasi Import

Untuk import bank soal:

- Pastikan `id` unik.
- Pastikan `code` unik.
- Pastikan `text` tidak kosong.
- Pastikan `responseType` valid.
- Pastikan `options` sesuai tipe jawaban.
- Pastikan `required` boolean.

Untuk import scoring config:

- Pastikan `instrumentName` dan `version` ada.
- Pastikan `scales` tidak kosong.
- Pastikan setiap scale punya `id`, `name`, `type`, dan `items`.
- Pastikan `questionId` merujuk item yang ada.
- Pastikan `point` numerik dan tidak negatif.
- Pastikan interpretation range tidak overlap.
- Pastikan norma, bila ada, memiliki raw score unik dan T-score numerik.
- Tampilkan error validasi dalam bahasa Indonesia yang mudah dipahami.

---

## UI/UX

Gunakan desain yang rapi, formal, dan mudah dipakai:

- Warna utama: biru tua, biru medium, putih, abu-abu netral.
- Hindari tampilan terlalu ramai.
- Semua tombol utama harus jelas.
- Gunakan card, table, badge status, progress bar, dan alert.
- Pastikan responsif untuk laptop dan tablet.
- Sediakan dark mode bila memungkinkan.
- Buat loading state, empty state, error state, dan success notification.
- Hindari istilah klinis yang terlalu absolut pada hasil otomatis.

---

## Keamanan dan Privasi

Untuk prototipe localStorage:

- Tampilkan security notice bahwa data tersimpan di browser.
- Sediakan fitur hapus data lokal.
- Sediakan backup/restore manual.
- Jangan simpan password plaintext.
- Jangan tampilkan data sensitif di console log.
- Tambahkan route guard untuk admin dan reviewer.
- Tambahkan timeout sesi admin sederhana.

Untuk rekomendasi produksi:

- Gunakan backend API.
- Gunakan database terenkripsi.
- Gunakan autentikasi server-side dan MFA.
- Terapkan RBAC di server.
- Simpan audit log server-side yang sulit dimanipulasi.
- Terapkan HTTPS, backup terenkripsi, dan retensi data.
- Pisahkan data identitas dari hasil psikologis bila kebijakan mensyaratkan.

---

## Audit Log

Catat aktivitas penting seperti:

- Login/logout admin.
- Import bank soal.
- Import scoring config.
- Pembuatan/revoke token.
- Peserta mulai tes.
- Peserta submit tes.
- Hasil dibuat.
- Review disimpan.
- Laporan difinalisasi.
- Data diekspor.
- Backup/restore.
- Penghapusan data.

Setiap audit log minimal berisi:

```ts
interface AuditLogEntry {
  id: string;
  actorId?: string;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
```

---

## Review Spesialis

Buat modul review dengan checklist:

- Identitas peserta sudah sesuai.
- Jumlah jawaban lengkap.
- Skala validitas telah ditinjau.
- Pola inkonsistensi/red flag sudah diberi catatan.
- RH Skrining sudah dibandingkan dengan profil skor.
- Interpretasi otomatis tidak digunakan sebagai diagnosis tunggal.
- Kesimpulan dan rekomendasi sudah ditulis oleh reviewer berwenang.

Buat status review:

- `awaiting_review`
- `in_review`
- `needs_revision`
- `finalized`

Finalisasi harus mengunci laporan agar tidak berubah tanpa membuat revisi/audit baru.

---

## Laporan dan Ekspor

Laporan harus memuat:

- Header institusi/aplikasi.
- Identitas peserta.
- Metadata tes: tanggal, versi bank soal, versi scoring config.
- Ringkasan hasil.
- Grafik profil skor.
- Tabel skor.
- Validity indicators.
- Interpretasi berbasis konfigurasi.
- RH Skrining dan red flag.
- Catatan spesialis.
- Kesimpulan dan rekomendasi.
- Tanda tangan/finalisasi internal.
- Disclaimer etik/klinis.

Ekspor minimal:

- JSON per peserta.
- CSV ringkasan hasil.
- Print browser untuk PDF.
- Backup semua data prototipe ke satu file JSON.

---

## Struktur Folder yang Disarankan

Gunakan struktur seperti berikut:

```text
src/
  components/
    auth/
    charts/
    review/
    rh/
    ui/
  data/
    sampleQuestions.json
    sampleScoringConfig.json
  pages/
  routes/
  services/
  utils/
  test/
  types.ts
  App.tsx
  main.tsx
docs/
  QUALITY_CHECK.md
  BACKEND_MIGRATION_PLAN.md
  DISASTER_RECOVERY.md
  AUDIT_AND_VERSIONING.md
  PRODUCTION_ROADMAP.md
```

---

## Sample Data Dummy

Sertakan hanya sample dummy seperti:

```json
[
  {
    "id": 1,
    "code": "Q001",
    "text": "Contoh item placeholder untuk menguji alur aplikasi. Ganti dengan item resmi berizin.",
    "responseType": "true_false",
    "options": [
      { "label": "Benar", "value": true },
      { "label": "Salah", "value": false }
    ],
    "required": true
  }
]
```

Jangan gunakan teks item psikotes asli.

---

## Testing dan Quality Gate

Tambahkan script di `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc -b --noEmit",
    "lint": "eslint .",
    "test": "vitest run",
    "quality": "npm run typecheck && npm run lint && npm run test && npm run build"
  }
}
```

Buat test untuk:

- Route utama bisa render.
- Import JSON valid/invalid.
- Scoring raw score.
- Token validation.
- RH red flag utility.
- Permission guard.
- Review checklist.

Quality gate wajib lulus:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run quality
```

Jika ada warning ukuran bundle, dokumentasikan dan usulkan split chunk/dynamic import.

---

## Dokumentasi yang Harus Dibuat

Buat dokumentasi berikut:

1. `README.md`
   - Deskripsi aplikasi.
   - Cara install.
   - Cara development.
   - Cara build.
   - Cara import bank soal/scoring.
   - Catatan etik dan privasi.

2. `docs/QUALITY_CHECK.md`
   - Perintah quality gate.
   - Cara membaca hasil test/lint/build.
   - Troubleshooting umum.

3. `docs/BACKEND_MIGRATION_PLAN.md`
   - Rencana migrasi dari localStorage ke backend.
   - Desain tabel/API awal.
   - Strategi auth dan audit.

4. `docs/PRODUCTION_ROADMAP.md`
   - Tahap menuju produksi.
   - Prioritas keamanan.
   - Checklist deploy.

5. `docs/DISASTER_RECOVERY.md`
   - Backup/restore.
   - Risiko localStorage.
   - Rencana pemulihan data.

6. `docs/AUDIT_AND_VERSIONING.md`
   - Audit log.
   - Versioning scoring config.
   - Finalisasi laporan.

---

## Tahapan Pengerjaan yang Diminta

Kerjakan bertahap dengan urutan:

1. Scaffold React + Vite + TypeScript + Tailwind.
2. Buat routing dan layout dasar.
3. Buat types dan storage service.
4. Buat sample data dummy.
5. Buat flow peserta: token, identitas, instruksi, test, submit.
6. Buat scoring engine berbasis konfigurasi.
7. Buat halaman hasil dan grafik.
8. Buat RH Skrining.
9. Buat admin login dan dashboard.
10. Buat import bank soal dan scoring config.
11. Buat token management.
12. Buat session monitoring.
13. Buat review spesialis dan finalisasi.
14. Buat audit log prototipe.
15. Buat backup/restore.
16. Tambahkan test, lint, typecheck.
17. Tambahkan dokumentasi.
18. Jalankan quality gate dan perbaiki error.

Setelah setiap tahap, jelaskan:

- File yang dibuat/diubah.
- Alasan desain teknis.
- Cara menjalankan.
- Test yang ditambahkan.
- Risiko atau pekerjaan lanjutan.

---

## Kriteria Selesai

Aplikasi dianggap selesai untuk prototipe bila:

- Bisa dijalankan dengan `npm run dev`.
- Bisa build dengan `npm run build`.
- Typecheck, lint, dan test lulus.
- Peserta bisa menyelesaikan alur dari token sampai submit.
- Admin bisa import pertanyaan dan scoring config.
- Hasil bisa dihitung dari config, bukan hardcoded.
- RH Skrining bisa diisi dan tampil di laporan.
- Reviewer bisa memberi catatan dan finalisasi.
- Data bisa diekspor dan dibackup.
- Dokumentasi utama tersedia.
- Tidak ada soal MMPI asli atau materi berlisensi di repository.

---

## Instruksi Output untuk AI/Developer

Saat membangun aplikasi, berikan output dengan format:

1. **Ringkasan perubahan**
2. **Daftar file penting**
3. **Cara menjalankan**
4. **Testing yang dijalankan**
5. **Catatan keamanan/etik**
6. **Langkah berikutnya**

Jangan mengklaim aplikasi siap produksi penuh sebelum backend, database terenkripsi, autentikasi server-side, audit log server-side, dan validasi klinis institusional tersedia.
