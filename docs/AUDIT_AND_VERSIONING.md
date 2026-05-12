# Audit Log dan Versioning Konfigurasi

## Audit log localStorage
Implementasi awal memakai key `sppg_mmpi2_audit_logs` dengan actor, action, target, metadata, dan severity. Mode ini membantu audit internal saat pengembangan, tetapi belum tahan perubahan manual oleh pemilik perangkat/browser.

## Aktivitas wajib
Aplikasi mencatat aktivitas login/logout, user, token, peserta mulai/submit, import konfigurasi, setting institusi, template laporan, pembukaan/export/cetak laporan, revisi, finalisasi, unlock, backup, restore, hapus data, dan reset aplikasi melalui utilitas `writeAuditLog`.

## Versioning config
Key `sppg_mmpi2_config_versions` menyimpan snapshot immutable untuk `questions`, `scoringConfig`, `normTable`, interpretasi Rusdi/Hubertus, codeType, summaryAnalysis, reportTemplate, dan rhTemplate.

## Status config
- `draft`: baru dibuat dan belum siap dipakai resmi.
- `validated`: lolos validasi struktur.
- `active`: dipakai untuk hasil baru.
- `archived`: versi lama setelah aktivasi versi lain.
- `rejected`: tidak valid.

## Aturan operasional
Config aktif tidak boleh di-overwrite tanpa snapshot. Hasil peserta menyimpan `configVersionsUsed` agar laporan lama tetap mengacu ke versi saat tes/laporan dibuat.
