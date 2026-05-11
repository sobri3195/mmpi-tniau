# Asesmen MMPI TNI Angkatan Udara

Aplikasi React + Vite + TypeScript untuk administrasi asesmen MMPI kebutuhan Kesehatan Jiwa TNI Angkatan Udara tanpa backend. Semua data disimpan di `localStorage` browser/perangkat pengguna.

## Prinsip Etis dan Klinis

- Repository ini **tidak menyertakan, menyalin, atau mengarang butir MMPI asli**.
- File `src/data/sampleQuestions.json` dan `src/data/sampleScoringConfig.json` hanya berisi dummy placeholder untuk uji alur.
- Gunakan hanya bank soal, scoring key, norma, dan interpretasi resmi/berizin yang Anda miliki hak pakainya.
- Interpretasi otomatis bersifat indikatif/skrining internal, bukan diagnosis klinis. Hasil wajib ditinjau psikolog, psikiater, atau konselor berwenang.

## Fitur

- Landing page TNI AU, formulir identitas sesuai kebutuhan MMPI, instruksi, halaman tes, laporan hasil, dan admin dashboard.
- Impor bank soal JSON/CSV resmi/berizin.
- Impor konfigurasi skala/scoring JSON berbasis konfigurasi; tidak ada kunci rahasia hardcoded.
- Autosave progres peserta ke `sppg_mmpi_current_session`.
- Scoring raw score per skala, interpretasi rentang skor, dan konversi T-score opsional jika norma tersedia.
- Grafik bar dan radar dengan Recharts.
- Ekspor JSON/CSV yang memuat identitas responden, cetak laporan/PDF melalui print browser, dark mode, dan reset data lokal.

## LocalStorage Keys

- `sppg_mmpi_questions`
- `sppg_mmpi_scoring_config`
- `sppg_mmpi_current_session`
- `sppg_mmpi_results`
- `sppg_mmpi_admin_settings`

## Instalasi dan Development

```bash
npm install
npm run dev
```

Build production:

```bash
npm run build
```

Preview build:

```bash
npm run preview
```

Deploy ke Vercel:

```bash
vercel deploy
```

Vercel akan membaca proyek Vite standar ini. Build command: `npm run build`, output directory: `dist`.

## Cara Impor Bank Soal Resmi/Berizin

Masuk ke halaman **Admin**, lalu import file JSON atau CSV.

### Format JSON Bank Soal

```json
[
  {
    "id": 1,
    "code": "Q001",
    "text": "Contoh item placeholder, ganti dengan soal resmi berizin.",
    "responseType": "true_false",
    "options": [
      { "label": "Benar", "value": true },
      { "label": "Salah", "value": false }
    ],
    "required": true
  }
]
```

### Format CSV Bank Soal

Bagian kepala minimal:

```csv
id,code,text,responseType,required
1,Q001,"Contoh item placeholder",true_false,true
2,Q002,"Contoh item placeholder",yes_no,true
```

`responseType` mendukung `true_false` atau `yes_no`.

## Cara Impor Konfigurasi Scoring

Impor file JSON pada panel **Scoring Config** di Admin.

```json
{
  "instrumentName": "MMPI Custom Licensed Bank",
  "version": "1.0",
  "scales": [
    {
      "id": "validity_l",
      "name": "Validity Scale L",
      "description": "Contoh skala validitas.",
      "type": "validity",
      "items": [
        { "questionId": 1, "scoredResponse": true, "point": 1 }
      ],
      "interpretationRules": [
        {
          "min": 0,
          "max": 3,
          "label": "Rendah",
          "description": "Interpretasi contoh. Ganti dengan interpretasi resmi/berizin."
        }
      ],
      "norms": [
        { "raw": 0, "tScore": 40 },
        { "raw": 1, "tScore": 50 }
      ]
    }
  ]
}
```

Jika `norms` tidak tersedia, aplikasi hanya menampilkan raw score dan label “Belum dikonversi ke norma resmi”.

## Catatan Privasi

Tidak ada backend dan tidak ada data yang dikirim ke server. Data peserta berada di browser yang sama dan dapat dihapus melalui dashboard Admin atau mekanisme pembersihan cache browser.
