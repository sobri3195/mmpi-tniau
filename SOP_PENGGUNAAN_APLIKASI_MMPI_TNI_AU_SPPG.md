# SOP Penggunaan Aplikasi MMPI TNI AU/SPPG

## Informasi Dokumen

| Elemen | Keterangan |
|---|---|
| Nama dokumen | SOP Penggunaan Aplikasi MMPI TNI AU/SPPG |
| Sasaran pengguna | Superadmin, Tester/Operator Tes, Spesialis/Dokter Jiwa/Psikolog Klinis, Peserta, Tim IT/Pengelola Aplikasi |
| Platform aplikasi | React + Vite + TypeScript + Tailwind CSS |
| Penyimpanan utama | `localStorage` browser |
| Lingkungan deploy | Vercel/static hosting |
| Status dokumen | Panduan operasional dan administratif |

> **Catatan penting:** Dokumen ini tidak memuat soal MMPI asli, kunci scoring asli, norma berizin, maupun interpretasi buku secara ilegal. Semua contoh konfigurasi pada lampiran menggunakan data dummy/placeholder.

---

## 1. Pendahuluan

Aplikasi MMPI TNI AU/SPPG adalah aplikasi administrasi asesmen yang membantu pelaksanaan, pencatatan, pengolahan, peninjauan, dan pelaporan hasil asesmen MMPI secara digital. Aplikasi ini ditujukan untuk mendukung proses kerja operator tes, superadmin, spesialis, dan peserta dalam satu alur operasional yang terdokumentasi.

### 1.1 Tujuan Aplikasi

Tujuan aplikasi adalah:

1. Menyediakan sarana digital untuk administrasi asesmen MMPI.
2. Memfasilitasi pengerjaan MMPI sebanyak **567 item** oleh peserta.
3. Menstandarkan alur pengisian identitas, pengerjaan tes, RH Skrining, dan pelaporan.
4. Membantu pengelola dalam mengelola token peserta, konfigurasi scoring, norma, interpretasi, hasil, dan backup.
5. Membantu spesialis dalam meninjau hasil asesmen dan menambahkan catatan profesional.

### 1.2 Fungsi Utama Aplikasi

Aplikasi berfungsi sebagai alat bantu administrasi asesmen MMPI, bukan sebagai pengganti pemeriksaan klinis. Fungsi utama aplikasi meliputi:

- Administrasi bank soal MMPI 567 item.
- Pencatatan jawaban peserta dalam format **`+`** dan **`-`**.
- Pengelolaan token akses peserta.
- Pengisian identitas peserta.
- Pengerjaan MMPI secara digital.
- Pengisian **RH Skrining / Daftar Isian Riwayat Kesehatan** setelah MMPI selesai.
- Pengolahan hasil berdasarkan konfigurasi yang diimpor oleh admin.
- Penyajian grafik, scoring, interpretasi, dan ringkasan.
- Penambahan catatan spesialis sebelum laporan difinalisasi.

### 1.3 Komponen Hasil Akhir

Hasil akhir aplikasi dapat memuat:

- Grafik profil MMPI.
- Scoring dan tabel skor.
- Interpretasi Rusdi Maslim, apabila konfigurasi resmi/berizin telah diimpor.
- Interpretasi Hubertus, apabila konfigurasi resmi/berizin telah diimpor.
- Analisa Ringkas TNI AU.
- Data RH Skrining.
- Red flag RH Skrining.
- Catatan validitas dari spesialis.
- Kesan klinis dan rekomendasi spesialis.
- Kesimpulan dan saran.

### 1.4 Penegasan Klinis

Hasil otomatis dari aplikasi **bukan diagnosis final**. Hasil otomatis hanya bersifat bantu telaah dan wajib ditinjau oleh dokter jiwa, psikolog klinis, atau profesional berwenang sebelum digunakan dalam proses klinis, administratif, maupun personel.

---

## 2. Batasan Etik dan Klinis

Aplikasi ini harus digunakan dengan memperhatikan batasan etik, klinis, perizinan, dan keamanan data.

### 2.1 Batasan Penggunaan Klinis

- Aplikasi tidak menggantikan pemeriksaan dokter jiwa, psikolog klinis, atau profesional kesehatan mental berwenang.
- Interpretasi otomatis harus ditinjau oleh profesional berwenang.
- Laporan otomatis tidak boleh digunakan sebagai satu-satunya dasar keputusan klinis, administratif, atau personel.
- Keputusan akhir harus mempertimbangkan wawancara klinis, observasi, riwayat kesehatan, RH Skrining, data pendukung, dan pertimbangan profesional.

### 2.2 Batasan Hak Cipta dan Perizinan

- Soal MMPI, scoring, norma, dan interpretasi harus berasal dari sumber resmi/berizin yang diimpor oleh admin.
- Jangan menyimpan soal asli, kunci scoring asli, norma berizin, atau interpretasi buku secara ilegal di source code publik.
- Jangan mengunggah file berisi materi berizin ke repository publik.
- Contoh konfigurasi pada dokumentasi, demo, atau lingkungan pengembangan harus memakai data dummy/placeholder.

### 2.3 Batasan Mode Demo

Apabila konfigurasi masih demo, placeholder, belum tervalidasi, atau belum berasal dari sumber resmi/berizin, maka:

- Laporan tidak valid untuk keputusan klinis.
- Laporan tidak boleh dipakai untuk seleksi, penempatan, pembinaan, tindakan administratif, atau keputusan personel.
- Superadmin wajib memberi label atau peringatan bahwa sistem masih menggunakan konfigurasi demo.

---

## 3. Peran Pengguna

Setiap pengguna wajib menggunakan aplikasi sesuai peran dan kewenangannya.

| Role | Hak Akses Utama | Batasan |
|---|---|---|
| Superadmin | Mengatur user, token, konfigurasi, hasil, backup, reset | Akses penuh |
| Tester/Operator | Generate token, pantau peserta, cetak token | Tidak boleh ubah scoring/norma |
| Spesialis | Review hasil, isi catatan klinis, finalisasi laporan | Tidak boleh ubah bank soal/scoring |
| Peserta | Login token, isi identitas, kerjakan MMPI, isi RH | Tidak boleh akses hasil klinis/admin |

### 3.1 Matriks Permission Operasional

| Aktivitas | Superadmin | Tester/Operator | Spesialis | Peserta |
|---|---:|---:|---:|---:|
| Membuat akun pengguna | Ya | Tidak | Tidak | Tidak |
| Mengubah role pengguna | Ya | Tidak | Tidak | Tidak |
| Import bank soal | Ya | Tidak | Tidak | Tidak |
| Import scoring/norma/interpretasi | Ya | Tidak | Tidak | Tidak |
| Generate token | Ya | Ya | Tidak | Tidak |
| Cetak kartu token | Ya | Ya | Tidak | Tidak |
| Login token peserta | Tidak | Tidak | Tidak | Ya |
| Mengisi MMPI | Tidak | Tidak | Tidak | Ya |
| Mengisi RH Skrining | Tidak | Tidak | Tidak | Ya |
| Melihat laporan klinis | Ya | Terbatas sesuai kebijakan | Ya | Tidak |
| Mengisi catatan spesialis | Tidak, kecuali memiliki kewenangan klinis | Tidak | Ya | Tidak |
| Finalisasi laporan | Ya sesuai kebijakan | Tidak | Ya | Tidak |
| Backup/restore/reset | Ya | Tidak | Tidak | Tidak |
| Melihat audit log | Ya | Terbatas sesuai kebijakan | Terbatas sesuai kebijakan | Tidak |

---

## 4. Struktur Sistem

Aplikasi dirancang sebagai aplikasi web statis berbasis frontend tanpa backend server.

### 4.1 Komponen Sistem

| Komponen | Keterangan |
|---|---|
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS |
| Penyimpanan | `localStorage` browser |
| Hosting/deploy | Vercel atau static hosting sejenis |
| Backend | Tidak menggunakan backend secara default |
| Database server | Tidak tersedia pada arsitektur default |
| Autentikasi server-side | Tidak tersedia pada arsitektur default |

### 4.2 Implikasi Arsitektur Tanpa Backend

Karena aplikasi menggunakan `localStorage`, data tersimpan pada browser/perangkat yang digunakan. Hal ini memiliki implikasi berikut:

- Data dapat hilang apabila cache/browser storage dihapus.
- Data tidak otomatis tersinkron antar komputer.
- Proteksi `localStorage` bukan keamanan setara server-level.
- Akses fisik ke perangkat berpotensi membuka risiko akses data.
- Backup rutin menjadi kewajiban operasional.

### 4.3 Rekomendasi Produksi Resmi

Untuk penggunaan resmi skala produksi, sangat disarankan melakukan peningkatan arsitektur menjadi:

- Backend server terkontrol.
- Database terenkripsi.
- Autentikasi dan otorisasi server-side.
- Audit log server-side.
- Enkripsi data sensitif saat tersimpan dan saat transmisi.
- Manajemen session yang aman.
- Kebijakan backup dan disaster recovery formal.

---

## 5. Data yang Digunakan

Aplikasi menggunakan data konfigurasi, data peserta, data hasil, dan data administratif yang disimpan di browser.

### 5.1 File/Konfigurasi Utama

| File/Konfigurasi | Fungsi |
|---|---|
| `questions.json` | Bank soal MMPI 567 item yang diimpor admin dari sumber resmi/berizin |
| `scoringConfig.json` | Konfigurasi scoring berdasarkan format resmi/berizin |
| `normTable.json` | Norma konversi skor, termasuk T-score apabila tersedia |
| `interpretationConfig` Rusdi Maslim | Konfigurasi interpretasi Rusdi Maslim dari sumber resmi/berizin |
| `interpretationConfig` Hubertus | Konfigurasi interpretasi Hubertus dari sumber resmi/berizin |
| `codeTypeConfig` | Konfigurasi tipe kode/profil jika digunakan aplikasi |
| `summaryAnalysisConfig` | Konfigurasi Analisa Ringkas TNI AU |
| RH Skrining form | Struktur form Daftar Isian Riwayat Kesehatan |
| Access tokens | Token dan unique key untuk peserta |
| Results | Hasil MMPI, scoring, status, dan metadata pengerjaan |
| Admin settings | Identitas institusi, pengaturan aplikasi, dan preferensi admin |

### 5.2 Key `localStorage`

| Key | Fungsi |
|---|---|
| `sppg_mmpi2_questions` | Bank soal |
| `sppg_mmpi2_scoring_config` | Konfigurasi scoring |
| `sppg_mmpi2_norm_table` | Norma T-score |
| `sppg_mmpi2_interpretation_rusdi_maslim` | Interpretasi Rusdi Maslim |
| `sppg_mmpi2_interpretation_hubertus` | Interpretasi Hubertus |
| `sppg_mmpi2_summary_analysis_config` | Analisa Ringkas TNI AU |
| `sppg_mmpi2_access_tokens` | Token peserta |
| `sppg_mmpi2_results` | Hasil peserta |
| `sppg_mmpi2_rh_forms` | Data RH Skrining |
| `sppg_mmpi2_users` | User admin |
| `sppg_mmpi2_auth_session` | Session admin |
| `sppg_mmpi2_audit_logs` | Audit log |

---

## 6. SOP Setup Awal Aplikasi

Setup awal hanya boleh dilakukan oleh Superadmin atau Tim IT yang diberi mandat.

### 6.1 Langkah Setup Awal

1. Buka aplikasi melalui URL resmi yang telah ditentukan.
2. Buat akun Superadmin pertama sesuai instruksi aplikasi.
3. Login sebagai Superadmin.
4. Atur identitas institusi, unit, alamat, nama pejabat/pemeriksa, dan pengaturan laporan.
5. Import bank soal melalui file `questions.json` yang valid dan berizin.
6. Import `scoringConfig.json`.
7. Import `normTable.json`.
8. Import `interpretationConfig` Rusdi Maslim.
9. Import `interpretationConfig` Hubertus.
10. Import `summaryAnalysisConfig` untuk Analisa Ringkas TNI AU.
11. Validasi kesiapan sistem melalui menu validasi/preview konfigurasi.
12. Buat akun Tester/Operator dan Spesialis sesuai kebutuhan.
13. Generate token peserta untuk sesi tes yang akan dilaksanakan.

### 6.2 Checklist Setup

| No. | Checklist | Status |
|---:|---|---|
| 1 | Superadmin dibuat | [ ] |
| 2 | Bank soal 567 item diimport | [ ] |
| 3 | Format jawaban `+` dan `-` valid | [ ] |
| 4 | `scoringConfig` valid | [ ] |
| 5 | Norma T-score valid | [ ] |
| 6 | Interpretasi Rusdi Maslim tersedia | [ ] |
| 7 | Interpretasi Hubertus tersedia | [ ] |
| 8 | Analisa Ringkas tersedia | [ ] |
| 9 | RH Skrining aktif | [ ] |
| 10 | Token peserta siap | [ ] |

### 6.3 Checklist Ringkas Setup

- [ ] Superadmin dibuat
- [ ] Bank soal 567 item diimport
- [ ] Format jawaban + dan - valid
- [ ] ScoringConfig valid
- [ ] Norma T-score valid
- [ ] Interpretasi Rusdi Maslim tersedia
- [ ] Interpretasi Hubertus tersedia
- [ ] Analisa Ringkas tersedia
- [ ] RH Skrining aktif
- [ ] Token peserta siap

---

## 7. SOP Superadmin

Superadmin bertanggung jawab atas kesiapan, keamanan, konfigurasi, dan integritas data aplikasi.

### 7.1 Login Superadmin

1. Buka URL aplikasi.
2. Pilih menu login admin.
3. Masukkan username dan password Superadmin.
4. Pastikan dashboard Superadmin tampil.
5. Periksa status konfigurasi aplikasi sebelum membuat sesi tes.

### 7.2 Membuat User Baru

1. Masuk ke menu Manajemen User.
2. Klik Tambah User.
3. Isi nama, username, password awal, dan role.
4. Pilih role sesuai tugas pengguna.
5. Simpan user.
6. Informasikan kredensial kepada pengguna melalui saluran aman.
7. Minta pengguna mengganti password apabila fitur tersedia.

### 7.3 Mengatur Role

1. Buka daftar user.
2. Pilih user yang akan diubah.
3. Ubah role sesuai kewenangan.
4. Simpan perubahan.
5. Periksa audit log untuk memastikan perubahan tercatat.

### 7.4 Import Bank Soal

1. Siapkan file `questions.json` dari sumber resmi/berizin.
2. Pastikan file tidak berisi data rusak dan jumlah item adalah 567.
3. Masuk ke menu Konfigurasi/Bank Soal.
4. Upload atau paste file konfigurasi.
5. Jalankan validasi.
6. Simpan apabila valid.
7. Jangan commit file soal asli ke source code publik.

### 7.5 Import Scoring, Norma, dan Interpretasi

1. Import `scoringConfig.json` melalui menu konfigurasi scoring.
2. Import `normTable.json` melalui menu norma.
3. Import `interpretationConfig` Rusdi Maslim.
4. Import `interpretationConfig` Hubertus.
5. Import `summaryAnalysisConfig`.
6. Pastikan setiap konfigurasi menunjukkan status valid.
7. Lakukan uji dummy sebelum tes resmi.

### 7.6 Backup Data

1. Masuk ke menu Backup/Export.
2. Pilih Backup Seluruh Data.
3. Simpan file backup JSON ke media penyimpanan aman.
4. Beri nama file dengan tanggal, unit, dan sesi.
5. Simpan minimal pada dua lokasi aman sesuai kebijakan institusi.

### 7.7 Restore Data

1. Pastikan restore dilakukan hanya oleh Superadmin.
2. Backup data yang sedang ada sebelum restore.
3. Pilih file backup JSON yang valid.
4. Jalankan restore.
5. Periksa data user, token, hasil, RH, dan audit log.
6. Catat tindakan restore pada berita acara internal apabila diperlukan.

### 7.8 Reset Data

1. Backup seluruh data sebelum reset.
2. Pastikan tidak ada sesi tes aktif.
3. Masuk ke menu Reset Data.
4. Baca peringatan dengan teliti.
5. Ketik konfirmasi **`RESET`** apabila benar-benar diperlukan.
6. Jalankan reset.
7. Verifikasi bahwa data yang dihapus sesuai pilihan reset.

### 7.9 Membaca Audit Log

1. Buka menu Audit Log.
2. Filter berdasarkan tanggal, user, atau jenis tindakan.
3. Periksa tindakan penting seperti login, import config, generate token, submit, export, restore, dan reset.
4. Simpan/export audit log jika diperlukan untuk pelaporan internal.

### 7.10 Mengelola Laporan

1. Masuk ke menu Hasil/Laporan.
2. Filter laporan berdasarkan status.
3. Pastikan laporan yang belum direview tidak diperlakukan sebagai laporan final.
4. Koordinasikan dengan Spesialis untuk review dan finalisasi.
5. Kunci laporan yang telah final sesuai prosedur.

> **Peringatan Superadmin:** Superadmin wajib memastikan konfigurasi bukan demo sebelum aplikasi digunakan untuk laporan resmi. Apabila konfigurasi masih demo/placeholder, laporan wajib diberi label tidak valid untuk keputusan klinis, administratif, atau personel.

---

## 8. SOP Tester / Operator

Tester/Operator bertanggung jawab terhadap pelaksanaan teknis sesi tes, distribusi token, dan pemantauan status peserta.

### 8.1 Login Tester

1. Buka URL aplikasi.
2. Pilih login admin/operator.
3. Masukkan username dan password Tester.
4. Pastikan dashboard operator tampil.
5. Periksa jadwal/sesi tes yang akan dilaksanakan.

### 8.2 Generate Token Peserta

1. Masuk ke menu Token Peserta.
2. Pilih Generate Token.
3. Tentukan sesi, masa berlaku, dan jumlah token.
4. Simpan token yang dibuat.
5. Pastikan setiap token memiliki unique key atau mekanisme validasi tambahan.

### 8.3 Generate Token Satuan

1. Pilih opsi token satuan.
2. Isi identitas awal peserta jika diperlukan.
3. Generate token.
4. Cetak atau simpan kartu token.
5. Serahkan token hanya kepada peserta yang berhak.

### 8.4 Generate Token Massal

1. Pilih opsi token massal.
2. Tentukan jumlah peserta.
3. Tentukan sesi dan masa berlaku.
4. Generate token.
5. Export daftar token apabila diperlukan.
6. Simpan daftar token di tempat aman.

### 8.5 Print Kartu Token

1. Pilih token yang akan dicetak.
2. Klik Print Kartu Token.
3. Pastikan token dan unique key terbaca jelas.
4. Jangan mencetak informasi klinis pada kartu token.
5. Bagikan kartu token secara langsung kepada peserta.

### 8.6 Memberikan Token kepada Peserta

1. Verifikasi identitas peserta sesuai prosedur internal.
2. Berikan token dan unique key.
3. Jelaskan bahwa token bersifat pribadi dan tidak boleh dibagikan.
4. Arahkan peserta membuka aplikasi dan klik Mulai Tes.
5. Berikan instruksi umum tanpa mengarahkan jawaban.

### 8.7 Memantau Status Peserta

| Status | Makna | Tindakan Operator |
|---|---|---|
| Belum mulai | Token belum digunakan | Pastikan peserta menerima token |
| Sedang mengerjakan | Peserta sedang mengisi MMPI | Pantau kendala teknis tanpa memengaruhi jawaban |
| MMPI selesai pending RH | MMPI selesai, RH belum selesai | Arahkan peserta melanjutkan RH Skrining |
| RH selesai | RH sudah dikirim | Pastikan status lanjut diproses |
| Completed | MMPI dan RH selesai | Tandai peserta selesai sesi |

### 8.8 Larangan Operator

- Tidak boleh mengubah scoring.
- Tidak boleh mengubah norma.
- Tidak boleh mengubah interpretasi.
- Tidak boleh melihat informasi klinis di luar kewenangan.
- Tidak boleh menjelaskan makna klinis skor kepada peserta.
- Tidak boleh menggunakan token peserta lain.

---

## 9. SOP Peserta

Peserta wajib mengerjakan tes secara mandiri, jujur, dan sesuai instruksi.

### 9.1 Alur Peserta

1. Buka aplikasi melalui URL resmi yang diberikan operator.
2. Klik **Mulai Tes**.
3. Masukkan token dan unique key.
4. Isi identitas sesuai data yang benar.
5. Baca instruksi pengerjaan sampai selesai.
6. Kerjakan 567 soal MMPI.
7. Pilih jawaban **`+`** atau **`-`** sesuai instruksi aplikasi.
8. Tidak boleh melewati soal kosong.
9. Submit MMPI setelah semua soal terjawab.
10. Lanjut isi RH Skrining.
11. Isi Surat Pernyataan / Informed Consent.
12. Isi Riwayat Kesehatan.
13. Isi bagian Pendidikan, Pekerjaan, Keluarga, dan Sosial.
14. Review jawaban RH.
15. Submit RH.
16. Selesai dan lapor kepada operator apabila diminta.

### 9.2 Aturan Pengerjaan MMPI

- Tombol **Berikutnya** aktif hanya jika soal sudah dijawab.
- Semua 567 soal wajib dijawab.
- Jawaban menggunakan format **`+`** dan **`-`**.
- Peserta tidak diperkenankan meminta orang lain menjawabkan soal.
- Peserta tidak diperkenankan berdiskusi tentang jawaban selama tes.
- Peserta wajib melapor kepada operator apabila mengalami kendala teknis.

### 9.3 Autosave dan Perangkat

- Data dapat tersimpan otomatis di browser apabila fitur autosave aktif.
- Jangan refresh atau menutup browser jika belum selesai, kecuali operator memastikan autosave aktif dan aman.
- Gunakan perangkat yang stabil dan tidak digunakan bergantian selama tes.
- Jangan menghapus cache, history, atau data browser selama proses tes berlangsung.

---

## 10. SOP RH Skrining

RH Skrining / Daftar Isian Riwayat Kesehatan wajib diisi setelah peserta menyelesaikan MMPI.

### 10.1 Bagian RH Skrining

1. Surat Pernyataan / Informed Consent.
2. Identitas.
3. Riwayat Kesehatan 50 item.
4. Kondisi fisik dan mental.
5. Obat rutin.
6. Kesulitan tidur.
7. Riwayat pendidikan.
8. Riwayat pekerjaan.
9. Riwayat keluarga.
10. Riwayat sosial.
11. Review dan submit.

### 10.2 Alur Pengisian RH Skrining

| Tahap | Aktivitas Peserta | Catatan |
|---|---|---|
| 1 | Membaca informed consent | Peserta memahami tujuan dan penggunaan data |
| 2 | Mengisi identitas | Data harus sesuai identitas resmi |
| 3 | Mengisi riwayat kesehatan | Jawab sesuai kondisi sebenarnya |
| 4 | Mengisi riwayat pendidikan/pekerjaan/keluarga/sosial | Lengkapi sesuai instruksi form |
| 5 | Review jawaban | Periksa kembali sebelum submit |
| 6 | Submit RH | Data terkirim untuk ditinjau spesialis |

### 10.3 Red Flag RH Skrining

Red flag adalah tanda yang memerlukan perhatian dan telaah lebih lanjut oleh spesialis. Contoh red flag meliputi:

- Halusinasi suara.
- Melihat bayangan.
- Kecurigaan berlebihan.
- Pernah ingin bunuh diri.
- Riwayat narkoba/zat adiktif.
- Masalah hukum.
- Dirawat inap.
- Kejang/epilepsi.
- Masalah berat yang membutuhkan pengobatan.

Red flag tidak otomatis menjadi diagnosis, tetapi menjadi tanda perlu telaah spesialis. Spesialis wajib menilai red flag dengan mempertimbangkan konteks klinis, wawancara, observasi, dan data pendukung.

---

## 11. SOP Spesialis

Spesialis bertanggung jawab meninjau hasil, memeriksa validitas profil, menelaah RH Skrining, dan menentukan catatan/rekomendasi profesional.

### 11.1 Login Spesialis

1. Buka URL aplikasi.
2. Pilih login admin/spesialis.
3. Masukkan username dan password.
4. Pastikan dashboard Spesialis tampil.
5. Periksa daftar laporan yang perlu review.

### 11.2 Review Laporan

1. Buka daftar laporan perlu review.
2. Pilih peserta yang akan ditinjau.
3. Lihat identitas peserta.
4. Lihat grafik MMPI.
5. Lihat tabel skor.
6. Lihat validitas profil.
7. Lihat interpretasi Rusdi Maslim.
8. Lihat interpretasi Hubertus.
9. Lihat Analisa Ringkas TNI AU.
10. Lihat RH Skrining.
11. Lihat red flag.
12. Bandingkan data MMPI, RH, dan informasi pendukung lain.

### 11.3 Pengisian Catatan Spesialis

1. Isi catatan validitas.
2. Isi kesan klinis.
3. Isi rekomendasi.
4. Pilih status laporan.
5. Simpan catatan.
6. Finalisasi laporan apabila sudah lengkap.
7. Cetak/PDF laporan bila diperlukan.

### 11.4 Status Review

| Status | Makna | Tindak Lanjut |
|---|---|---|
| Sudah direview | Laporan telah ditinjau | Dapat dilanjutkan sesuai kebijakan |
| Perlu wawancara | Data memerlukan klarifikasi | Jadwalkan wawancara klinis |
| Perlu retest | Profil/administrasi perlu pengulangan | Koordinasikan retest dengan operator |
| Perlu rujukan | Diperlukan pemeriksaan lanjutan | Rujuk sesuai jalur layanan |
| Final | Laporan selesai dan dikunci | Cetak/arsipkan sesuai prosedur |

### 11.5 Penguncian Laporan

Laporan yang sudah dikunci tidak boleh diedit kecuali dibuka oleh Superadmin. Pembukaan kunci harus memiliki alasan yang jelas dan tercatat pada audit log.

---

## 12. SOP Laporan Hasil

Laporan hasil harus dibaca sebagai dokumen bantu telaah yang memerlukan penilaian profesional.

### 12.1 Isi Laporan

Laporan dapat memuat:

- Header institusi.
- Identitas peserta.
- Waktu mulai dan selesai tes.
- Durasi pengerjaan.
- Total soal dan total dijawab.
- Status validitas.
- Grafik bar chart.
- Grafik line chart.
- Radar chart.
- Tabel skor.
- Interpretasi Rusdi Maslim.
- Interpretasi Hubertus.
- Perbandingan interpretasi.
- Analisa Ringkas TNI AU.
- RH Skrining.
- Red flag RH.
- Catatan spesialis.
- Kesimpulan dan saran.
- Tanda tangan pemeriksa.

### 12.2 Alur Laporan

| Tahap | Penanggung Jawab | Output |
|---|---|---|
| Peserta selesai MMPI | Peserta | Jawaban MMPI lengkap |
| Peserta selesai RH | Peserta | RH Skrining lengkap |
| Scoring otomatis | Sistem | Skor/grafik/interpretasi otomatis sesuai config |
| Review spesialis | Spesialis | Catatan validitas, kesan, rekomendasi |
| Finalisasi | Spesialis/Superadmin sesuai kebijakan | Laporan final terkunci |
| Cetak/arsip | Superadmin/Spesialis sesuai kebijakan | PDF/cetak/arsip internal |

### 12.3 Ketentuan Laporan

- Laporan otomatis belum final sebelum direview spesialis.
- Laporan dengan konfigurasi demo tidak boleh dipakai sebagai dasar keputusan.
- Laporan yang memuat data sensitif harus disimpan dan dibagikan secara terbatas.
- Laporan final harus mencantumkan penanggung jawab/pemeriksa sesuai kebijakan institusi.

---

## 13. Analisa Ringkas TNI AU

Analisa Ringkas TNI AU adalah bagian laporan yang menyajikan ringkasan profil berdasarkan konfigurasi yang diimpor admin.

### 13.1 Section Analisa Ringkas

I. Sikap Terhadap Tes  
II. Indeks Kapasitas Mental  
III. Profil Klinis  
IV. Indeks Kepribadian Dasar / OCEAN  
V. Kesimpulan dan Saran

### 13.2 Prinsip Perhitungan

Semua indeks Analisa Ringkas TNI AU dihitung dari `summaryAnalysisConfig` yang diimpor admin, bukan dari rumus hardcode dalam source code. Dengan demikian:

- Perubahan definisi indeks dilakukan melalui konfigurasi resmi/berizin.
- Admin wajib memastikan konfigurasi valid sebelum digunakan.
- Jika `summaryAnalysisConfig` masih dummy/demo, bagian analisa ringkas tidak boleh digunakan untuk keputusan resmi.
- Spesialis tetap wajib meninjau hasil ringkasan sebelum finalisasi.

---

## 14. SOP Export dan Cetak

Export dan cetak hanya boleh dilakukan oleh pengguna yang berwenang.

### 14.1 Jenis Export/Cetak

| Jenis | Fungsi | Pengguna Berwenang |
|---|---|---|
| Export JSON peserta | Menyimpan data lengkap peserta tertentu | Superadmin, sesuai kebijakan |
| Export CSV peserta | Rekap data tabular peserta | Superadmin, Tester terbatas sesuai kebijakan |
| Export seluruh hasil | Backup/arsip hasil seluruh peserta | Superadmin |
| Print laporan lengkap | Cetak laporan final/hasil review | Superadmin/Spesialis |
| Print RH Skrining | Cetak data RH | Superadmin/Spesialis |
| Print Analisa Ringkas | Cetak bagian ringkasan | Superadmin/Spesialis |
| Print kartu token | Mencetak token peserta | Superadmin/Tester |
| Backup seluruh data | Menyimpan semua data aplikasi | Superadmin |

### 14.2 Langkah Export Data

1. Login sesuai role yang berwenang.
2. Buka menu Export/Backup/Laporan.
3. Pilih jenis export.
4. Pilih peserta, sesi, atau seluruh data sesuai kebutuhan.
5. Jalankan export.
6. Simpan file di lokasi aman.
7. Catat export pada audit log apabila tersedia.

### 14.3 Langkah Cetak Laporan

1. Buka laporan peserta.
2. Pastikan status review sesuai kebutuhan cetak.
3. Klik Print/PDF.
4. Periksa preview cetak.
5. Cetak atau simpan PDF.
6. Simpan dokumen sesuai prosedur kerahasiaan.

> **Aturan kerahasiaan:** Jangan membagikan file export tanpa izin karena berisi data sensitif. File export wajib diperlakukan sebagai dokumen rahasia.

---

## 15. SOP Backup dan Restore

Backup dan restore adalah prosedur wajib karena aplikasi menggunakan `localStorage`.

### 15.1 Backup Rutin

1. Backup dilakukan oleh Superadmin.
2. Gunakan fitur Backup Seluruh Data.
3. Format backup disarankan berupa JSON.
4. Simpan backup dengan nama file yang jelas.
5. Simpan backup pada media aman dan terbatas.

### 15.2 Waktu Backup yang Disarankan

| Waktu | Tujuan |
|---|---|
| Sebelum tes resmi | Mengamankan konfigurasi awal |
| Setelah import konfigurasi | Mengamankan config final |
| Setelah generate token | Mengamankan daftar token |
| Setelah seluruh peserta completed | Mengamankan hasil tes |
| Sebelum restore | Mengamankan data lama |
| Sebelum reset | Mengamankan data sebelum penghapusan |

### 15.3 Restore Data

1. Restore hanya boleh dilakukan oleh Superadmin.
2. Sebelum restore, wajib backup data lama.
3. Pastikan file backup berasal dari sumber yang benar.
4. Jalankan restore melalui menu aplikasi.
5. Verifikasi data setelah restore.
6. Periksa audit log setelah proses restore.

### 15.4 Reset Data

1. Reset hanya dilakukan apabila benar-benar diperlukan.
2. Backup seluruh data sebelum reset.
3. Pastikan tidak ada proses tes aktif.
4. Gunakan konfirmasi **`RESET`** sesuai instruksi aplikasi.
5. Simpan bukti/berita acara internal apabila reset dilakukan pada data resmi.

---

## 16. SOP Keamanan dan Privasi

Data aplikasi termasuk data sensitif dan harus dilindungi.

### 16.1 Ketentuan Keamanan

- Data tersimpan di `localStorage` browser.
- Jangan gunakan komputer umum tanpa prosedur keamanan.
- Jangan hapus cache sebelum backup.
- Jangan membagikan token.
- Jangan menyimpan token di URL.
- Jangan membuka hasil peserta di perangkat yang tidak aman.
- Untuk produksi resmi gunakan backend dan database terenkripsi.

### 16.2 Praktik Keamanan Minimum

| Area | Praktik Minimum |
|---|---|
| Perangkat | Gunakan perangkat institusi yang terkendali |
| Browser | Gunakan browser yang diperbarui dan tidak dipakai bersama publik |
| Akun | Gunakan password kuat dan role sesuai kewenangan |
| Token | Bagikan secara individual dan jangan melalui kanal publik |
| Export | Simpan file export di lokasi terenkripsi/terbatas |
| Cetak | Ambil dokumen cetak segera dari printer |
| Backup | Simpan backup pada media aman dengan akses terbatas |

### 16.3 Pengelolaan Insiden

Apabila terjadi kehilangan data, akses tidak sah, token bocor, atau perangkat hilang:

1. Hentikan penggunaan perangkat/sesi terkait.
2. Laporkan kepada Superadmin dan penanggung jawab institusi.
3. Cabut token yang berpotensi bocor.
4. Lakukan backup data yang masih tersedia.
5. Restore dari backup apabila diperlukan.
6. Dokumentasikan kejadian dan tindak lanjut.

---

## 17. SOP Audit Log

Audit log digunakan untuk mencatat aktivitas penting dalam aplikasi.

### 17.1 Tindakan yang Dicatat

- Login/logout.
- Buat user.
- Generate token.
- Import config.
- Submit MMPI.
- Submit RH.
- Review spesialis.
- Finalisasi laporan.
- Export data.
- Reset data.

### 17.2 Pemantauan Audit Log

1. Superadmin membuka menu Audit Log.
2. Filter log berdasarkan tanggal, user, atau tindakan.
3. Periksa tindakan berisiko seperti import konfigurasi, export, restore, reset, dan perubahan user.
4. Simpan audit log apabila diperlukan untuk pemeriksaan internal.
5. Laporkan anomali kepada penanggung jawab aplikasi.

### 17.3 Contoh Struktur Audit Log

| Field | Contoh | Keterangan |
|---|---|---|
| `timestamp` | `2026-05-11T08:30:00.000Z` | Waktu tindakan |
| `actor` | `admin01` | Pengguna yang melakukan tindakan |
| `role` | `superadmin` | Role pengguna |
| `action` | `IMPORT_CONFIG` | Jenis tindakan |
| `target` | `normTable` | Objek tindakan |
| `status` | `success` | Status tindakan |
| `notes` | `Import normTable final` | Catatan tambahan |

---

## 18. Troubleshooting

| Masalah | Penyebab Kemungkinan | Solusi |
|---|---|---|
| Token tidak valid | Token salah/expired/revoked | Cek di Admin Token |
| Tidak bisa klik Berikutnya | Soal belum dijawab | Pilih `+` atau `-` |
| Submit gagal | Ada soal kosong | Lompat ke soal belum dijawab |
| Hasil belum muncul | RH belum selesai | Isi RH Skrining |
| Interpretasi tidak muncul | Config belum diimport | Import `interpretationConfig` |
| Grafik kosong | T-score/`normTable` belum tersedia | Import `normTable` |
| Laporan mode demo | Config masih demo | Import config final |
| Data hilang | Cache browser terhapus | Restore backup |

### 18.1 Langkah Umum Penanganan Kendala

1. Catat nama peserta, token, waktu kejadian, dan perangkat yang digunakan.
2. Jangan menghapus cache atau storage sebelum dilakukan pemeriksaan.
3. Hubungi Superadmin atau Tim IT.
4. Periksa status token, hasil, RH, dan audit log.
5. Gunakan backup apabila data tidak dapat dipulihkan dari browser.

---

## 19. Checklist Sebelum Tes Resmi

| No. | Checklist | Status |
|---:|---|---|
| 1 | Aplikasi berjalan normal | [ ] |
| 2 | Bank soal 567 valid | [ ] |
| 3 | Jawaban `+` dan `-` valid | [ ] |
| 4 | Token tersedia | [ ] |
| 5 | Operator siap | [ ] |
| 6 | Spesialis siap | [ ] |
| 7 | RH Skrining aktif | [ ] |
| 8 | Backup awal dibuat | [ ] |
| 9 | Printer/PDF dicek | [ ] |
| 10 | Disclaimer tampil | [ ] |

### 19.1 Checklist Ringkas

- [ ] Aplikasi berjalan normal
- [ ] Bank soal 567 valid
- [ ] Jawaban + dan - valid
- [ ] Token tersedia
- [ ] Operator siap
- [ ] Spesialis siap
- [ ] RH Skrining aktif
- [ ] Backup awal dibuat
- [ ] Printer/PDF dicek
- [ ] Disclaimer tampil

---

## 20. Checklist Setelah Tes

| No. | Checklist | Status |
|---:|---|---|
| 1 | Semua peserta completed | [ ] |
| 2 | RH selesai | [ ] |
| 3 | Red flag ditandai | [ ] |
| 4 | Laporan perlu review dicek spesialis | [ ] |
| 5 | Laporan final dikunci | [ ] |
| 6 | Export/backup dilakukan | [ ] |
| 7 | Audit log diperiksa | [ ] |

### 20.1 Checklist Ringkas

- [ ] Semua peserta completed
- [ ] RH selesai
- [ ] Red flag ditandai
- [ ] Laporan perlu review dicek spesialis
- [ ] Laporan final dikunci
- [ ] Export/backup dilakukan
- [ ] Audit log diperiksa

---

## 21. Disclaimer Resmi

> “Aplikasi ini adalah alat administrasi dan bantu telaah asesmen. Hasil otomatis bukan diagnosis klinis final dan tidak boleh digunakan sebagai satu-satunya dasar keputusan klinis, administratif, atau personel. Interpretasi akhir wajib dilakukan oleh dokter jiwa, psikolog klinis, atau profesional berwenang dengan mempertimbangkan wawancara klinis, observasi, riwayat kesehatan, RH Skrining, dan data pendukung lain.”

---

## 22. Lampiran

Lampiran berikut hanya berisi contoh struktur teknis dengan data dummy/placeholder. Jangan memasukkan soal MMPI asli, kunci scoring asli, norma berizin, atau interpretasi buku secara ilegal ke repository publik.

### Lampiran A — Contoh Format Token Peserta

| Field | Contoh Dummy | Keterangan |
|---|---|---|
| Nama sesi | `SESI-SPPG-2026-001` | Nama sesi tes |
| Token | `SPPG-ABCD-1234` | Token akses peserta |
| Unique key | `K7P9Q2` | Kode validasi tambahan |
| Masa berlaku | `2026-05-11 08:00–12:00` | Waktu penggunaan token |
| Status | `Belum mulai` | Status awal token |

Contoh kartu token:

```text
====================================
KARTU TOKEN PESERTA
Sesi       : SESI-SPPG-2026-001
Token      : SPPG-ABCD-1234
Unique Key : K7P9Q2
URL        : https://contoh-aplikasi.vercel.app
Catatan    : Token bersifat pribadi.
====================================
```

### Lampiran B — Contoh Struktur `questions.json` Tanpa Soal Asli

```json
{
  "version": "dummy-1.0.0",
  "sourceNotice": "Placeholder. Ganti dengan bank soal resmi/berizin melalui import admin.",
  "totalItems": 567,
  "answerFormat": ["+", "-"],
  "items": [
    {
      "id": 1,
      "number": 1,
      "text": "[PLACEHOLDER_ITEM_001_BUKAN_SOAL_ASLI]",
      "required": true
    },
    {
      "id": 2,
      "number": 2,
      "text": "[PLACEHOLDER_ITEM_002_BUKAN_SOAL_ASLI]",
      "required": true
    }
  ]
}
```

### Lampiran C — Contoh Struktur `scoringConfig.json` Dummy

```json
{
  "version": "dummy-1.0.0",
  "mode": "demo",
  "warning": "Konfigurasi dummy. Tidak valid untuk keputusan klinis.",
  "scales": [
    {
      "code": "SCALE_X",
      "label": "Skala Dummy X",
      "items": [
        { "item": 1, "key": "+", "weight": 1 },
        { "item": 2, "key": "-", "weight": 1 }
      ],
      "rawScoreMethod": "sum"
    }
  ],
  "validityRules": [
    {
      "id": "DUMMY_VALIDITY_RULE",
      "description": "Contoh aturan dummy, bukan aturan resmi.",
      "condition": "SCALE_X >= 0"
    }
  ]
}
```

### Lampiran D — Contoh Struktur `interpretationConfig` Dummy

```json
{
  "version": "dummy-1.0.0",
  "mode": "demo",
  "source": "Placeholder. Ganti dengan konfigurasi resmi/berizin.",
  "interpretations": [
    {
      "scale": "SCALE_X",
      "range": { "minT": 50, "maxT": 60 },
      "label": "Rentang Dummy",
      "text": "Teks interpretasi placeholder. Tidak boleh digunakan untuk keputusan klinis."
    }
  ],
  "disclaimer": "Interpretasi dummy tidak valid untuk laporan resmi."
}
```

### Lampiran E — Contoh Struktur `summaryAnalysisConfig` Dummy

```json
{
  "version": "dummy-1.0.0",
  "mode": "demo",
  "sections": [
    {
      "id": "attitude_toward_test",
      "title": "I. Sikap Terhadap Tes",
      "indicators": [
        {
          "id": "dummy_consistency",
          "label": "Indikator Konsistensi Dummy",
          "sourceScales": ["SCALE_X"],
          "rules": [
            {
              "when": "SCALE_X >= 50",
              "result": "Contoh narasi dummy."
            }
          ]
        }
      ]
    },
    {
      "id": "mental_capacity_index",
      "title": "II. Indeks Kapasitas Mental",
      "indicators": []
    },
    {
      "id": "clinical_profile",
      "title": "III. Profil Klinis",
      "indicators": []
    },
    {
      "id": "personality_ocean",
      "title": "IV. Indeks Kepribadian Dasar / OCEAN",
      "indicators": []
    },
    {
      "id": "conclusion_recommendation",
      "title": "V. Kesimpulan dan Saran",
      "indicators": []
    }
  ]
}
```

### Lampiran F — Contoh Format Backup

```json
{
  "backupVersion": "1.0.0",
  "createdAt": "2026-05-11T08:30:00.000Z",
  "createdBy": "superadmin",
  "application": "MMPI TNI AU/SPPG",
  "storage": {
    "sppg_mmpi2_questions": {},
    "sppg_mmpi2_scoring_config": {},
    "sppg_mmpi2_norm_table": {},
    "sppg_mmpi2_interpretation_rusdi_maslim": {},
    "sppg_mmpi2_interpretation_hubertus": {},
    "sppg_mmpi2_summary_analysis_config": {},
    "sppg_mmpi2_access_tokens": [],
    "sppg_mmpi2_results": [],
    "sppg_mmpi2_rh_forms": [],
    "sppg_mmpi2_users": [],
    "sppg_mmpi2_audit_logs": []
  },
  "integrityNote": "Contoh backup dummy. Pastikan backup resmi disimpan secara aman."
}
```

### Lampiran G — Glosarium Istilah

| Istilah | Definisi |
|---|---|
| MMPI | Instrumen asesmen psikologis yang dalam aplikasi ini diadministrasikan secara digital sesuai konfigurasi resmi/berizin |
| Item | Butir pertanyaan/pernyataan dalam MMPI |
| Jawaban `+` | Format jawaban positif/ya/setuju sesuai instruksi tes dan konfigurasi |
| Jawaban `-` | Format jawaban negatif/tidak/tidak setuju sesuai instruksi tes dan konfigurasi |
| RH Skrining | Daftar Isian Riwayat Kesehatan yang diisi setelah MMPI |
| Red flag | Tanda yang memerlukan telaah lebih lanjut oleh spesialis |
| Token | Kode akses peserta untuk memulai tes |
| Unique key | Kode validasi tambahan untuk memastikan token digunakan peserta yang benar |
| ScoringConfig | Konfigurasi penghitungan skor yang diimpor admin |
| NormTable | Tabel norma/konversi skor yang diimpor admin |
| InterpretationConfig | Konfigurasi interpretasi yang diimpor admin dari sumber resmi/berizin |
| SummaryAnalysisConfig | Konfigurasi Analisa Ringkas TNI AU |
| localStorage | Penyimpanan data pada browser/perangkat lokal |
| Backup | Salinan data aplikasi untuk pemulihan |
| Restore | Proses mengembalikan data dari backup |
| Audit log | Catatan aktivitas penting pengguna dan sistem |
| Finalisasi | Proses mengunci laporan setelah review selesai |
| Mode demo | Kondisi konfigurasi placeholder/dummy yang tidak valid untuk keputusan resmi |

---

## Penutup

SOP ini digunakan sebagai acuan resmi operasional aplikasi MMPI TNI AU/SPPG. Setiap pengguna wajib menjalankan aplikasi sesuai role, menjaga kerahasiaan data, memastikan konfigurasi resmi/berizin, dan mematuhi batasan etik serta klinis. Hasil aplikasi harus selalu ditinjau oleh profesional berwenang sebelum digunakan dalam keputusan apa pun.
