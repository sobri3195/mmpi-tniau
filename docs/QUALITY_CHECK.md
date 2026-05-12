# Quality Check MMPI TNI AU/SPPG

Dokumen ini merangkum perbaikan kualitas berdasarkan pengecekan repository tanggal **11 Mei 2026**. Build produksi sebelumnya sudah berhasil, tetapi project belum memiliki script test/lint/typecheck, konfigurasi ESLint, konfigurasi Vitest, serta dokumentasi audit/proxy.

## Ringkasan Perbaikan

- Script `typecheck`, `lint`, `lint:fix`, `test`, `test:watch`, `test:ui`, dan `quality` tersedia di `package.json`.
- ESLint flat config ditambahkan untuk React + TypeScript, React Hooks, dan React Refresh.
- Vitest menggunakan environment `jsdom` dan setup React Testing Library melalui `src/test/setup.ts`.
- Test dasar ditambahkan untuk render aplikasi, scoring, tanggal lahir, dan validasi token.
- Bundle dioptimalkan melalui `React.lazy`/`Suspense` untuk halaman besar dan `manualChunks` di Vite untuk memisahkan React serta Recharts.
- Catatan audit npm dan proxy didokumentasikan agar kegagalan environment tidak dianggap otomatis sebagai vulnerability aplikasi.

## Command Quality Check

### Install dependency

```bash
npm install
```

> Catatan: jika environment memblokir registry npm atau endpoint audit, `npm install`/`npm audit` dapat gagal dengan `403 Forbidden`. Lihat bagian audit dan proxy di bawah.

### Build produksi

```bash
npm run build
```

### Typecheck

```bash
npm run typecheck
```

Script ini menjalankan TypeScript project references tanpa menghasilkan output build tambahan.

### Lint

```bash
npm run lint
```

Untuk auto-fix rule yang aman:

```bash
npm run lint:fix
```

### Test otomatis

```bash
npm test
```

Mode watch:

```bash
npm run test:watch
```

UI Vitest:

```bash
npm run test:ui
```

### Semua quality gate

```bash
npm run quality
```

Command ini menjalankan typecheck, lint, test, lalu build produksi secara berurutan.

## NPM Audit

Jalankan audit keamanan dengan:

```bash
npm audit --audit-level=high
```

Jika command gagal dengan `403 Forbidden`, jangan langsung menganggapnya sebagai vulnerability aplikasi. Penyebab umum adalah registry, proxy, atau policy jaringan yang memblokir endpoint audit npm.

Langkah pengecekan:

```bash
npm config get registry
npm config list
```

Pastikan registry mengarah ke:

```text
https://registry.npmjs.org/
```

Lalu jalankan ulang:

```bash
npm audit --audit-level=high
```

Jika memakai proxy, pastikan konfigurasi `proxy` dan `https-proxy` valid. Di CI, pastikan akses ke registry dan endpoint audit npm tidak diblokir oleh firewall/proxy.

## Warning `http-proxy`

Warning seperti berikut berasal dari environment/npm config, bukan dari kode aplikasi:

```text
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.
```

Periksa sumber konfigurasi:

```bash
npm config list
```

Cari juga konfigurasi di:

- `.npmrc`
- environment variable CI
- package manager config
- proxy shell environment

Jika ada konfigurasi `http-proxy` yang tidak didukung npm, ganti ke konfigurasi npm yang valid:

```bash
npm config set proxy http://proxy:8080
npm config set https-proxy http://proxy:8080
```

Atau hapus environment variable yang tidak valid dari CI/shell dan gunakan hanya `proxy` / `https-proxy`.

## Warning Ukuran Bundle

Vite dapat menampilkan warning:

```text
Some chunks are larger than 500 kB after minification.
```

Perbaikan yang sudah diterapkan:

- Halaman besar diload secara lazy dengan `React.lazy` dan `Suspense`.
- Chunk `react` dipisahkan untuk `react` dan `react-dom`.
- Chunk `charts` dipisahkan untuk `recharts`.
- `chunkSizeWarningLimit` dinaikkan ke `1000` setelah pemisahan chunk agar warning lebih realistis untuk aplikasi laporan/chart.

Jika warning muncul lagi, evaluasi komponen report/chart/admin yang paling besar dan pertimbangkan lazy loading yang lebih granular untuk panel admin atau utilitas export/PDF.
