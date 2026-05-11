import type { Answers, Question, ScaleConfig, ScoreRow, ScoringConfig, ValidityStatus } from '../types';

const getScaleGroup = (scale: ScaleConfig) => scale.group ?? scale.type ?? 'other';
const getNorms = (scale: ScaleConfig) => scale.tScoreConversion ?? scale.norms ?? [];

export const convertRawToTScore = (rawScore: number, scaleConfig: ScaleConfig) => {
  const norms = getNorms(scaleConfig);
  if (!norms.length) return undefined;
  return norms.find((norm) => norm.raw === rawScore)?.tScore;
};

export const calculateTScore = convertRawToTScore;

export const categorizeScore = (score: number, scaleConfig: ScaleConfig, isTScore = true) => {
  if (isTScore) {
    if (score < 50) return { label: 'rendah', description: 'T-score berada di bawah rerata normatif. Makna klinis perlu dikonfirmasi oleh profesional.' };
    if (score < 65) return { label: 'dalam batas umum', description: 'T-score berada dalam batas umum berdasarkan aturan interpretasi otomatis.' };
    if (score < 75) return { label: 'elevated/perlu perhatian', description: 'T-score mengindikasikan elevasi yang perlu perhatian dan konfirmasi melalui evaluasi profesional.' };
    return { label: 'high elevated/perlu evaluasi profesional', description: 'T-score mengindikasikan elevasi tinggi sehingga perlu evaluasi profesional dan integrasi dengan data klinis lain.' };
  }

  const rawRule = scaleConfig.interpretationRules?.find((item) => score >= item.min && score <= item.max);
  return {
    label: rawRule?.label ?? 'Belum dikonversi ke norma resmi',
    description: rawRule?.description ?? 'Raw score tersedia, tetapi belum ada norma resmi untuk mengonversi dan menafsirkan skor ini.',
  };
};

export const calculateRawScores = (answers: Answers, scoringConfig: ScoringConfig): ScoreRow[] => {
  return scoringConfig.scales.map((scale) => {
    const rawScore = scale.items.reduce((total, item) => {
      const answer = answers[String(item.questionId)];
      return answer === item.scoredResponse ? total + Number(item.point || 0) : total;
    }, 0);
    const tScore = convertRawToTScore(rawScore, scale);
    const category = categorizeScore(tScore ?? rawScore, scale, tScore !== undefined);
    return {
      scaleId: scale.id,
      code: scale.code ?? scale.id,
      scaleName: scale.name,
      rawScore,
      tScore,
      category: category.label,
      interpretation: category.description,
      normStatus: tScore === undefined ? 'Belum dikonversi ke norma resmi' : 'Menggunakan tabel norma konfigurasi',
      type: getScaleGroup(scale),
    };
  });
};

export const determineValidity = (scores: ScoreRow[], scoringConfig: ScoringConfig): ValidityStatus => {
  const validityScaleIds = new Set(scoringConfig.scales.filter((scale) => getScaleGroup(scale) === 'validity').map((scale) => scale.id));
  const validityScores = scores.filter((score) => validityScaleIds.has(score.scaleId));
  if (!validityScores.length) return { status: 'unknown', label: 'Validitas belum tersedia', reasons: ['Konfigurasi belum memiliki skala validitas. Interpretasi perlu sangat hati-hati.'] };
  const invalidMarkers = validityScores.filter((score) => score.tScore !== undefined ? score.tScore >= 75 : /tinggi|invalid|tidak valid|high/i.test(score.category));
  const cautionMarkers = validityScores.filter((score) => score.tScore !== undefined ? score.tScore >= 65 && score.tScore < 75 : /sedang|waspada|perhatian|elevated/i.test(score.category));
  if (invalidMarkers.length) return { status: 'invalid', label: 'Profil perlu review/retest', reasons: invalidMarkers.map((score) => `${score.scaleId}: ${score.category}`) };
  if (cautionMarkers.length) return { status: 'caution', label: 'Validitas perlu perhatian', reasons: cautionMarkers.map((score) => `${score.scaleId}: ${score.category}`) };
  return { status: 'valid', label: 'Indikator validitas memadai', reasons: ['Tidak ada peringatan mayor pada skala validitas yang tersedia.'] };
};

export const generateInterpretations = (scores: ScoreRow[], _scoringConfig?: ScoringConfig) => scores.map((score) => ({
  scaleId: score.scaleId,
  label: score.category,
  description: score.interpretation,
}));

export const generateClinicalSummary = (scores: ScoreRow[], validityStatus: ValidityStatus) => {
  if (validityStatus.status === 'invalid') return 'Profil validitas mengindikasikan hasil belum layak untuk kesimpulan klinis final. Perlu review/retest oleh profesional.';
  const clinicalScores = scores.filter((score) => score.type === 'clinical');
  const elevated = clinicalScores.filter((score) => score.tScore !== undefined && score.tScore >= 65);
  if (!clinicalScores.length) return 'Skala klinis belum tersedia pada konfigurasi. Laporan hanya menampilkan skor yang dapat dihitung.';
  if (!elevated.length) return 'Skor klinis yang tersedia tidak mengindikasikan elevasi tinggi. Tetap perlu dikonfirmasi dengan wawancara, observasi, dan data pendukung.';
  return `Terdapat kecenderungan/elevasi pada ${elevated.map((score) => `${score.scaleId} (${score.scaleName})`).join(', ')} yang perlu dikonfirmasi melalui evaluasi profesional.`;
};

export const generateRecommendations = (scores: ScoreRow[], validityStatus: ValidityStatus) => {
  if (validityStatus.status === 'invalid') return ['Perlu review/retest oleh profesional sebelum membuat kesimpulan klinis.', 'Jangan gunakan laporan otomatis ini sebagai dasar diagnosis final atau keputusan tunggal.'];
  const hasMissingNorm = scores.some((score) => score.tScore === undefined);
  return [
    'Integrasikan hasil dengan anamnesis, observasi, riwayat kesehatan, dan data administratif yang relevan.',
    hasMissingNorm ? 'Beberapa skala belum dikonversi ke norma resmi; gunakan raw score secara terbatas dan hindari klaim klinis kuat.' : 'Gunakan T-score sesuai norma resmi/berizin yang diimpor admin.',
    'Bila ada risiko keselamatan atau penurunan fungsi bermakna, lakukan evaluasi profesional sesuai SOP.',
  ];
};

export const validateScoringConfig = (config: ScoringConfig | null, questions?: Question[]) => {
  if (!config) return 'Konfigurasi scoring belum tersedia.';
  if (!Array.isArray(config.scales) || config.scales.length === 0) return 'Konfigurasi scoring harus memiliki minimal satu skala.';
  const invalid = config.scales.find((scale) => !scale.id || !scale.name || !Array.isArray(scale.items) || scale.items.length === 0 || !Array.isArray(scale.interpretationRules));
  if (invalid) return `Skala ${invalid.id || '(tanpa ID)'} belum valid.`;
  const itemWithoutQuestion = config.scales.flatMap((scale) => scale.items.map((item) => ({ scaleId: scale.id, questionId: item.questionId }))).find((item) => !Number.isFinite(item.questionId));
  if (itemWithoutQuestion) return `Item scoring pada skala ${itemWithoutQuestion.scaleId} memiliki questionId tidak valid.`;
  if (questions?.length) {
    const questionIds = new Set(questions.map((question) => question.id));
    const missing = config.scales.flatMap((scale) => scale.items.map((item) => ({ scaleId: scale.id, questionId: item.questionId }))).filter((item) => !questionIds.has(item.questionId));
    if (missing.length) return `${missing.length} item scoring tidak terhubung ke bank soal. Contoh: ${missing[0].scaleId} → questionId ${missing[0].questionId}.`;
  }
  return '';
};

export const summarizeScoringConfig = (config: ScoringConfig | null, questions: Question[]) => {
  const validationMessage = validateScoringConfig(config, questions);
  const scales = config?.scales ?? [];
  const validityScales = scales.filter((scale) => getScaleGroup(scale) === 'validity');
  const clinicalScales = scales.filter((scale) => getScaleGroup(scale) === 'clinical');
  const questionIds = new Set(questions.map((question) => question.id));
  const connectedItems = scales.flatMap((scale) => scale.items).filter((item) => questionIds.has(item.questionId)).length;
  return { validationMessage, isValid: !validationMessage, scaleCount: scales.length, validityScales, clinicalScales, connectedItems };
};

export const generateChartData = (scores: ScoreRow[]) => scores.map((score) => ({
  scale: score.code ?? score.scaleId,
  name: score.scaleName,
  rawScore: score.rawScore,
  tScore: score.tScore ?? null,
  plottedTScore: score.tScore ?? 0,
}));
