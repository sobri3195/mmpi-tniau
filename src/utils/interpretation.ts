import type { ScoreRow } from '../types';

const ELEVATED_T_SCORE = 65;
const BORDERLINE_T_SCORE = 60;

const normalize = (value: string) => value.toLowerCase();

const hasCategory = (score: ScoreRow, keywords: string[]) => {
  const haystack = normalize(`${score.category} ${score.interpretation}`);
  return keywords.some((keyword) => haystack.includes(keyword));
};

const scoreForRanking = (score: ScoreRow) => score.tScore ?? score.rawScore;

export const isElevatedScore = (score: ScoreRow) => {
  if (typeof score.tScore === 'number') return score.tScore >= ELEVATED_T_SCORE;
  return hasCategory(score, ['tinggi', 'elevated', 'bermakna', 'signifikan', 'risiko']);
};

export const isBorderlineScore = (score: ScoreRow) => {
  if (typeof score.tScore === 'number') return score.tScore >= BORDERLINE_T_SCORE && score.tScore < ELEVATED_T_SCORE;
  return hasCategory(score, ['sedang', 'borderline', 'waspada', 'perlu perhatian']);
};

export const getScoreTone = (score: ScoreRow): 'teal' | 'amber' | 'rose' | 'slate' => {
  if (isElevatedScore(score)) return 'rose';
  if (isBorderlineScore(score)) return 'amber';
  if (hasCategory(score, ['rendah', 'normal', 'adaptif', 'minimal'])) return 'teal';
  return 'slate';
};

export interface SpecialistInterpretation {
  validitySummary: string;
  clinicalSummary: string;
  dominantScales: ScoreRow[];
  elevatedScales: ScoreRow[];
  borderlineScales: ScoreRow[];
  recommendations: string[];
  limitations: string[];
  appendix: { term: string; description: string }[];
}

export const generateSpecialistInterpretation = (scores: ScoreRow[]): SpecialistInterpretation => {
  const validityScores = scores.filter((score) => score.type === 'validity');
  const clinicalScores = scores.filter((score) => score.type === 'clinical');
  const interpretedScores = clinicalScores.length ? clinicalScores : scores.filter((score) => score.type !== 'validity');
  const elevatedScales = interpretedScores.filter(isElevatedScore).sort((a, b) => scoreForRanking(b) - scoreForRanking(a));
  const borderlineScales = interpretedScores.filter((score) => !isElevatedScore(score) && isBorderlineScore(score)).sort((a, b) => scoreForRanking(b) - scoreForRanking(a));
  const dominantScales = [...interpretedScores].sort((a, b) => scoreForRanking(b) - scoreForRanking(a)).slice(0, 5);
  const elevatedValidity = validityScores.filter(isElevatedScore);
  const missingNorms = scores.filter((score) => score.tScore === undefined).length;

  const validitySummary = validityScores.length === 0
    ? 'Skala validitas belum tersedia pada konfigurasi scoring, sehingga konsistensi dan gaya respons perlu dinilai melalui wawancara klinis serta observasi pemeriksa.'
    : elevatedValidity.length > 0
      ? `Terdapat indikator validitas yang perlu ditelaah (${elevatedValidity.map((score) => score.scaleId).join(', ')}). Interpretasi profil sebaiknya dilakukan hati-hati dan dikonfirmasi dengan wawancara klinis.`
      : 'Indikator validitas yang tersedia tidak menunjukkan peringatan mayor berdasarkan aturan konfigurasi yang diimpor. Profil tetap perlu diverifikasi oleh pemeriksa berwenang.';

  const clinicalSummary = elevatedScales.length > 0
    ? `Profil mengindikasikan elevasi pada ${elevatedScales.length} skala utama, terutama ${elevatedScales.slice(0, 3).map((score) => `${score.scaleId} (${score.scaleName})`).join(', ')}. Area tersebut perlu dikonfirmasi dan menjadi fokus eksplorasi klinis lanjutan.`
    : borderlineScales.length > 0
      ? `Tidak tampak elevasi tinggi yang dominan, namun terdapat area waspada pada ${borderlineScales.slice(0, 3).map((score) => `${score.scaleId} (${score.scaleName})`).join(', ')}.`
      : 'Tidak tampak elevasi klinis menonjol berdasarkan aturan konfigurasi yang tersedia. Tetap pertimbangkan keluhan aktual, riwayat, fungsi kerja, dan observasi pemeriksa.';

  const recommendations = [
    elevatedValidity.length > 0
      ? 'Prioritaskan telaah validitas respons sebelum menyimpulkan aspek klinis.'
      : 'Lakukan integrasi hasil dengan anamnesis, observasi perilaku, dan data administratif/medis yang relevan.',
    elevatedScales.length > 0
      ? 'Eksplorasi skala yang meningkat melalui wawancara terstruktur untuk menilai intensitas gejala, durasi, faktor pencetus, fungsi kerja, dan risiko keselamatan.'
      : 'Gunakan hasil sebagai data pendukung; tidak perlu membuat kesimpulan diagnostik hanya dari skor otomatis.',
    'Bila ditemukan risiko bunuh diri, kekerasan, gangguan realitas, penyalahgunaan zat, atau penurunan fungsi bermakna, lakukan rujukan segera sesuai SOP layanan kesehatan jiwa.',
  ];

  const limitations = [
    'Interpretasi ini bersifat otomatis dan bukan diagnosis psikiatri final.',
    'Sistem tidak menyertakan norma atau kunci MMPI proprietari; akurasi bergantung pada konfigurasi resmi/berizin yang diimpor admin.',
    missingNorms > 0
      ? `${missingNorms} skala belum memiliki konversi T-score sehingga interpretasi skala tersebut mengandalkan raw score dan label konfigurasi.`
      : 'Seluruh skala pada laporan ini memiliki T-score sesuai konfigurasi norma yang diimpor.',
  ];

  const appendix = [
    { term: 'Raw score', description: 'Jumlah respons yang memenuhi kunci scoring pada suatu skala sebelum dikonversi ke norma.' },
    { term: 'T-score', description: 'Skor standar berbasis norma. Secara umum T-score 50 adalah rata-rata normatif dan 10 poin setara satu simpangan baku; gunakan norma resmi instrumen untuk keputusan klinis.' },
    { term: 'Elevasi klinis', description: `Pada laporan otomatis ini, T-score ≥ ${ELEVATED_T_SCORE} atau label kategori tinggi/bermakna diperlakukan sebagai area yang perlu eksplorasi klinis.` },
    { term: 'Area waspada', description: `T-score ${BORDERLINE_T_SCORE}-${ELEVATED_T_SCORE - 1} atau label sedang/waspada diperlakukan sebagai temuan yang perlu dikonfirmasi dengan wawancara.` },
    { term: 'Skala validitas', description: 'Skala yang membantu menilai gaya respons, konsistensi, defensivitas, atau kemungkinan over-reporting/under-reporting sesuai pedoman instrumen.' },
    { term: 'Skala klinis', description: 'Skala yang menggambarkan area kecenderungan klinis dan harus dikonfirmasi melalui evaluasi profesional, bukan diagnosis final.' },
    { term: 'Kategori interpretasi', description: 'T-score <50 rendah, 50–64 dalam batas umum, 65–74 elevated/perlu perhatian, dan ≥75 high elevated/perlu evaluasi profesional.' },
    { term: 'Batasan interpretasi', description: 'Raw score tanpa T-score diberi label belum dikonversi ke norma resmi dan tidak boleh digunakan untuk klaim klinis kuat.' },
  ];

  return { validitySummary, clinicalSummary, dominantScales, elevatedScales, borderlineScales, recommendations, limitations, appendix };
};
