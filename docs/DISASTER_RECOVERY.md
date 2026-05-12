# Backup, Restore, dan Disaster Recovery

## Mode localStorage
Versi saat ini menyediakan backup full, snapshot pre-import, snapshot pre-reset, restore, checksum sederhana, dan lockdown mode pada key `sppg_mmpi2_backups`, `sppg_mmpi2_snapshots`, dan `sppg_mmpi2_lockdown_mode`.

## Lockdown mode
Saat lockdown aktif:
- Peserta tidak dapat memulai sesi baru.
- Import config baru harus ditunda.
- Superadmin tetap dapat export backup.
- Banner insiden tampil di admin.

## Prosedur insiden
1. Aktifkan lockdown mode.
2. Buat backup full.
3. Export audit log.
4. Identifikasi perubahan config/token/result terakhir.
5. Restore snapshot bila diperlukan.
6. Catat alasan restore dan pembukaan lockdown di audit log.

## Produksi backend
Gunakan backup database terenkripsi, object storage versioned untuk laporan final, restore drill, monitoring integritas checksum, dan dokumentasi RPO/RTO yang disetujui institusi.
