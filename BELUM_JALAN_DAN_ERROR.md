# Catatan: Yang Belum Jalan dan Error

Tanggal pengecekan: 11 Mei 2026

Dokumen ini merangkum hasil pengecekan singkat terhadap aplikasi berdasarkan perintah yang dijalankan di repository.

## Ringkasan Status

| Area | Status | Catatan |
| --- | --- | --- |
| Build produksi | Jalan | `npm run build` berhasil sampai selesai. |
| Test otomatis | Belum jalan | Script `test` belum tersedia di `package.json`. |
| Linting | Belum jalan | Script `lint` belum tersedia di `package.json`. |
| Audit keamanan npm | Error lingkungan/akses | Endpoint audit npm mengembalikan `403 Forbidden`. |
| Warning npm | Ada warning | npm menampilkan warning `Unknown env config "http-proxy"`. |
| Ukuran bundle | Ada warning | Bundle JavaScript hasil build lebih besar dari batas warning Vite/Rollup 500 kB. |

## Detail Pengecekan

### 1. Build Produksi Berhasil

Perintah:

```bash
npm run build
```

Hasil:

- TypeScript build berhasil.
- Vite build berhasil.
- Output build dibuat di folder `dist/`.
- Tidak ada error kompilasi yang menghentikan build.

Catatan warning dari build:

```text
Some chunks are larger than 500 kB after minification.
```

Dampak:

- Aplikasi tetap bisa dibuild.
- Namun ukuran bundle utama cukup besar sehingga initial load berpotensi lebih berat.

Rekomendasi:

- Pertimbangkan `dynamic import()` untuk halaman atau panel besar.
- Pertimbangkan konfigurasi `build.rollupOptions.output.manualChunks` di Vite.
- Jika ukuran tersebut masih bisa diterima, batas warning dapat disesuaikan lewat `build.chunkSizeWarningLimit`.

## Yang Belum Jalan

### 1. Test Otomatis Belum Tersedia

Perintah:

```bash
npm test
```

Error:

```text
Missing script: "test"
```

Penyebab:

- `package.json` belum memiliki script `test`.

Dampak:

- Belum ada cara standar untuk menjalankan test otomatis dari npm.
- Perubahan kode belum bisa divalidasi dengan unit test/integration test melalui command standar.

Rekomendasi:

- Tambahkan test runner, misalnya Vitest dan React Testing Library.
- Tambahkan script seperti:

```json
{
  "scripts": {
    "test": "vitest run"
  }
}
```

### 2. Linting Belum Tersedia

Perintah:

```bash
npm run lint
```

Error:

```text
Missing script: "lint"
```

Penyebab:

- `package.json` belum memiliki script `lint`.

Dampak:

- Belum ada pengecekan standar untuk style, potensi bug JavaScript/TypeScript, dan aturan React.

Rekomendasi:

- Tambahkan ESLint untuk TypeScript dan React.
- Tambahkan script seperti:

```json
{
  "scripts": {
    "lint": "eslint ."
  }
}
```

## Error dan Warning Saat Pengecekan

### 1. npm Audit Gagal Karena 403 Forbidden

Perintah:

```bash
npm audit --audit-level=high
```

Error:

```text
audit 403 Forbidden - POST https://registry.npmjs.org/-/npm/v1/security/advisories/bulk
Forbidden
npm error audit endpoint returned an error
```

Kemungkinan penyebab:

- Pembatasan akses jaringan atau registry npm pada environment saat pengecekan.
- Konfigurasi proxy/registry npm bermasalah.

Dampak:

- Status vulnerability dependency belum bisa dipastikan dari environment ini.

Rekomendasi:

- Jalankan ulang audit di environment lokal/CI dengan akses registry npm yang normal.
- Cek konfigurasi npm:

```bash
npm config get registry
npm config list
```

### 2. Warning Konfigurasi npm `http-proxy`

Muncul pada beberapa perintah npm:

```text
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.
```

Dampak:

- Saat ini tidak menghentikan build.
- Pada versi npm mayor berikutnya, konfigurasi ini berpotensi tidak didukung.

Rekomendasi:

- Cek environment variable atau konfigurasi npm yang mengatur `http-proxy`.
- Gunakan nama konfigurasi proxy npm yang masih didukung.

## Kesimpulan

Saat pengecekan ini, aplikasi **sudah bisa build untuk production**. Yang belum jalan adalah **test otomatis** dan **linting** karena script belum tersedia. Error utama yang muncul berasal dari **npm audit 403 Forbidden**, sehingga hasil audit keamanan dependency belum bisa dipastikan di environment ini. Selain itu, ada warning ukuran bundle yang perlu dipantau untuk performa aplikasi.
