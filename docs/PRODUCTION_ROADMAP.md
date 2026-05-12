# Roadmap Produksi MMPI TNI AU/SPPG

Dokumen ini menjelaskan arah migrasi dari mode `localStorage` menuju platform operasional produksi. Seluruh scoring, norma, bank soal, dan interpretasi tetap wajib berasal dari konfigurasi resmi/berizin yang diimpor admin; aplikasi tidak menyimpan konten proprietary di source code.

## Tahap 1 — Fondasi Produksi
- **Backend aplikasi**: API server untuk autentikasi, token, sesi, hasil, RH Skrining, audit, konfigurasi, dan laporan.
- **Database terenkripsi**: PostgreSQL/MySQL dengan enkripsi at-rest, backup terenkripsi, dan field-level encryption untuk data sensitif.
- **Autentikasi server-side**: sesi HTTP-only, rotasi session, rate limit login, dan kebijakan password/PIN institusi.
- **Audit log tersentral**: append-only, timestamp server, actor server-side, dan proteksi perubahan manual.
- **Versioning konfigurasi**: snapshot immutable untuk bank soal, scoringConfig, normTable, interpretasi, RH template, dan reportTemplate.
- **Backup restore dasar**: backup full, snapshot pre-import/pre-reset, restore teruji, checksum, dan retensi.

## Tahap 2 — Operasional dan Review Klinis
- **Monitoring sesi real-time**: websocket/server polling untuk status peserta, progress, idle, interrupted, dan permintaan bantuan operator.
- **Workflow review bertingkat**: verifikasi operator, review spesialis, final approval, revisi, unlock superadmin, dan audit trail.
- **Checklist validitas klinis**: checklist wajib sebelum finalisasi untuk memastikan laporan otomatis tidak menjadi diagnosis final tanpa telaah profesional.
- **Kontrol token lanjutan**: batch token, sekali pakai, expiry per gelombang, QR, revoke massal, reset, dan satu token satu sesi aktif.
- **Template laporan configurable**: komponen laporan dapat diaktif/nonaktifkan, versioned, dan disetujui sebelum dipakai.

## Tahap 3 — Integrasi dan Optimasi
- **PDF server-side**: rendering HTML/PDF konsisten dengan watermark, nomor dokumen, signature, dan hash verifikasi.
- **API internal**: endpoint untuk sistem personel/institusi dengan scope dan audit yang jelas.
- **SSO institusi**: SAML/OIDC/LDAP/AD dengan mapping role Superadmin, Tester, Spesialis, dan pejabat approval.
- **Dashboard statistik**: metrik operasional agregat tanpa membuka detail klinis rahasia.
- **Deteksi anomali operasional**: durasi ekstrem, idle massal, token bermasalah, pending review tinggi, perubahan config dekat jadwal tes, dan red flag agregat.
