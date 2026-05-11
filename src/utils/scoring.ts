import type { Answers, Question, ScaleConfig, ScoreRow, ScoringConfig, ValidityStatus } from '../types';
import { determineProtocolValidity } from './validity';
import { isAnswerValue, normalizeAnswerValue, REQUIRED_TOTAL_QUESTIONS } from './answerFormat';

export const getScaleGroup = (scale: ScaleConfig) => (scale.group ?? scale.type ?? 'other').toString().toLowerCase();
const getNorms = (scale: ScaleConfig) => scale.tScoreConversion ?? scale.norms ?? [];

export const isDemoScoringConfig = (config?: ScoringConfig | null) => {
  if (!config) return false;
  const haystack = [config.instrumentName, config.version, String(config.notice ?? ''), ...config.scales.flatMap((scale) => [scale.id, scale.code ?? '', scale.name, scale.description ?? ''])].join(' ').toLowerCase();
  return /clinical_demo|validity_?demo|demo|dummy|sample|placeholder/.test(haystack);
};

export const convertRawToTScore = (rawScore: number, scaleConfig: ScaleConfig) => {
  const norms = getNorms(scaleConfig);
  if (!norms.length) return undefined;
  return norms.find((norm) => norm.raw === rawScore)?.tScore;
};

export const calculateTScore = convertRawToTScore;

export const categorizeScore = (score: number, scaleConfig: ScaleConfig, isTScore = true, config?: ScoringConfig | null) => {
  if (isTScore) {
    const rules = config?.tScoreRules;
    const lowMax = rules?.lowMax ?? 49;
    const normalMax = rules?.normalMax ?? 59;
    const borderlineMax = rules?.borderlineMax ?? 64;
    const elevatedMax = rules?.elevatedMax ?? 74;
    if (score <= lowMax) return { label: 'rendah / below average', elevationLevel: 'low', description: 'T-score berada di bawah rerata normatif. Makna klinis perlu dikonfirmasi oleh profesional.' };
    if (score <= normalMax) return { label: 'rata-rata / normal range', elevationLevel: 'normal', description: 'T-score berada dalam rentang umum berdasarkan norma yang tersedia.' };
    if (score <= borderlineMax) return { label: 'borderline / area waspada', elevationLevel: 'borderline', description: 'T-score berada pada area waspada; perlu dikonfirmasi melalui wawancara klinis dan konteks tugas.' };
    if (score <= elevatedMax) return { label: 'clinically elevated / perlu perhatian klinis', elevationLevel: 'elevated', description: 'T-score mengindikasikan elevasi klinis yang perlu perhatian dan konfirmasi melalui evaluasi profesional.' };
    return { label: 'markedly elevated / perlu evaluasi mendalam', elevationLevel: 'markedly elevated', description: 'T-score mengindikasikan elevasi tinggi sehingga perlu evaluasi mendalam oleh profesional berwenang.' };
  }

  const rawRule = scaleConfig.interpretationRules?.find((item) => score >= item.min && score <= item.max);
  return {
    label: rawRule?.label ?? 'Belum dikonversi',
    elevationLevel: 'norma belum tersedia',
    description: rawRule?.description ?? 'Belum dapat diinterpretasikan secara klinis karena belum dikonversi ke norma resmi.',
  };
};

export const calculateRawScores = (answers: Answers, scoringConfig: ScoringConfig): ScoreRow[] => scoringConfig.scales.map((scale) => {
  const rawScore = scale.items.reduce((total, item) => {
    const answer = normalizeAnswerValue(answers[String(item.questionId)]);
    return answer !== undefined && answer === item.scoredResponse ? total + Number(item.point || 0) : total;
  }, 0);
  const tScore = convertRawToTScore(rawScore, scale);
  const category = categorizeScore(tScore ?? rawScore, scale, tScore !== undefined, scoringConfig);
  const rule = scale.interpretationRules?.find((item) => (tScore ?? rawScore) >= item.min && (tScore ?? rawScore) <= item.max);
  return {
    scaleId: scale.id,
    code: scale.code ?? scale.id,
    scaleName: scale.name,
    rawScore,
    tScore,
    category: category.label,
    elevationLevel: category.elevationLevel,
    interpretation: tScore === undefined ? 'Belum dapat diinterpretasikan secara klinis karena belum dikonversi ke norma resmi.' : (rule?.description ?? category.description),
    normStatus: tScore === undefined ? 'Norma belum tersedia' : 'Menggunakan tabel norma konfigurasi resmi/berizin yang diimpor admin',
    type: getScaleGroup(scale),
    group: getScaleGroup(scale),
    note: tScore === undefined ? 'Badge: Norma belum tersedia; gunakan raw score secara terbatas.' : 'Interpretasi otomatis perlu konfirmasi profesional.',
  };
});

export const determineValidity = (scores: ScoreRow[], scoringConfig: ScoringConfig): ValidityStatus => determineProtocolValidity(scores, scoringConfig);
export { determineProtocolValidity };

export const generateInterpretations = (scores: ScoreRow[]) => scores.map((score) => ({ scaleId: score.scaleId, label: score.category, description: score.interpretation }));

export const generateClinicalSummary = (scores: ScoreRow[], validityStatus: ValidityStatus) => {
  if (validityStatus.status === 'invalid') return 'Profil respons belum memadai untuk interpretasi klinis final. Disarankan telaah manual/tes ulang oleh profesional berwenang.';
  const clinicalScores = scores.filter((score) => score.type === 'clinical');
  const elevated = clinicalScores.filter((score) => score.tScore !== undefined && score.tScore >= 65);
  if (!clinicalScores.length) return 'Skala klinis MMPI-2 belum tersedia pada konfigurasi. Laporan hanya menampilkan skor yang dapat dihitung.';
  if (!elevated.length) return 'Tidak ditemukan elevasi klinis bermakna berdasarkan data dan norma yang tersedia. Tetap perlu mempertimbangkan wawancara, observasi, dan riwayat psikososial.';
  return `Skala yang menunjukkan elevasi bermakna adalah ${elevated.map((score) => `${score.code ?? score.scaleId} (${score.scaleName})`).join(', ')}. Temuan ini merupakan indikasi area yang perlu dieksplorasi, bukan diagnosis final.`;
};

export const generateRecommendations = (scores: ScoreRow[], validityStatus: ValidityStatus) => {
  if (validityStatus.status === 'invalid') return ['Jangan buat kesimpulan klinis final dari profil ini.', 'Lakukan telaah manual/tes ulang dan evaluasi kondisi saat tes, motivasi, pemahaman instruksi, kelelahan, atau defensiveness.'];
  const high = scores.some((score) => score.type === 'clinical' && (score.tScore ?? 0) >= 75);
  const elevated = scores.some((score) => score.type === 'clinical' && (score.tScore ?? 0) >= 65);
  if (validityStatus.status === 'caution') return ['Lakukan telaah manual terhadap protokol validitas.', 'Konfirmasi respons melalui wawancara klinis dan pertimbangkan tes ulang bila diperlukan.'];
  if (high) return ['Evaluasi psikolog klinis/psikiater dan pendalaman riwayat gejala.', 'Pertimbangkan asesmen risiko; jangan ambil keputusan tunggal dari laporan otomatis.'];
  if (elevated) return ['Wawancara klinis terarah dan pemeriksaan psikologis tambahan bila perlu.', 'Monitoring kondisi emosional, stres kerja, dan fungsi interpersonal.'];
  return ['Dapat dilanjutkan sesuai prosedur institusi dengan tetap mempertimbangkan wawancara dan observasi.', 'Gunakan hasil sebagai data pendukung, bukan dasar tunggal diagnosis atau keputusan personel.'];
};

export const validateScoringConfig = (config: ScoringConfig | null, questions?: Question[], options?: { requireOfficial?: boolean }) => {
  if (!config) return 'Konfigurasi scoring belum tersedia.';
  if (!Array.isArray(config.scales) || config.scales.length === 0) return 'Konfigurasi scoring harus memiliki minimal satu skala.';
  if (options?.requireOfficial && isDemoScoringConfig(config)) return 'Konfigurasi perlu diverifikasi sebelum dipakai untuk laporan final klinis/personel.';
  if (questions && questions.length !== REQUIRED_TOTAL_QUESTIONS) return `Total item harus ${REQUIRED_TOTAL_QUESTIONS} untuk MMPI-2; saat ini ${questions.length}.`;
  const invalid = config.scales.find((scale) => !scale.id || !(scale.code ?? scale.id) || !scale.name || !scale.group || !Array.isArray(scale.items) || scale.items.length === 0);
  if (invalid) return `Skala ${invalid?.id || '(tanpa ID)'} harus punya id, code, name, group, dan items.`;
  const itemWithoutQuestion = config.scales.flatMap((scale) => scale.items.map((item) => ({ scaleId: scale.id, questionId: item.questionId }))).find((item) => !Number.isFinite(item.questionId));
  if (itemWithoutQuestion) return `Item scoring pada skala ${itemWithoutQuestion.scaleId} memiliki questionId tidak valid.`;
  const itemWithInvalidResponse = config.scales.flatMap((scale) => scale.items.map((item) => ({ scaleId: scale.id, questionId: item.questionId, scoredResponse: item.scoredResponse }))).find((item) => !isAnswerValue(item.scoredResponse));
  if (itemWithInvalidResponse) return `Item scoring pada skala ${itemWithInvalidResponse.scaleId} questionId ${itemWithInvalidResponse.questionId} wajib memakai scoredResponse "+" atau "-".`;
  if (questions?.length) {
    const questionIds = new Set(questions.map((question) => question.id));
    const missing = config.scales.flatMap((scale) => scale.items.map((item) => ({ scaleId: scale.id, questionId: item.questionId }))).filter((item) => !questionIds.has(item.questionId));
    if (missing.length) return `${missing.length} item scoring tidak terhubung ke bank soal. Contoh: ${missing[0].scaleId} → questionId ${missing[0].questionId}.`;
  }
  const clinicalWithoutNorm = config.scales.find((scale) => ['clinical', 'rc', 'content', 'supplementary', 'psy5'].includes(getScaleGroup(scale)) && !getNorms(scale).length);
  if (clinicalWithoutNorm && !isDemoScoringConfig(config)) return `Skala ${clinicalWithoutNorm.id} belum memiliki konversi T-score; raw score boleh ditampilkan tetapi tidak boleh diinterpretasikan klinis kuat.`;
  const withoutRules = config.scales.find((scale) => !scale.interpretationRules?.length);
  if (withoutRules) return `Skala ${withoutRules.id} belum memiliki interpretationRules.`;
  return '';
};

export const summarizeScoringConfig = (config: ScoringConfig | null, questions: Question[]) => {
  const validationMessage = validateScoringConfig(config, questions);
  const finalValidationMessage = validateScoringConfig(config, questions, { requireOfficial: true });
  const scales = config?.scales ?? [];
  const validityScales = scales.filter((scale) => getScaleGroup(scale) === 'validity');
  const clinicalScales = scales.filter((scale) => getScaleGroup(scale) === 'clinical');
  const questionIds = new Set(questions.map((question) => question.id));
  const connectedItems = scales.flatMap((scale) => scale.items).filter((item) => questionIds.has(item.questionId)).length;
  return { validationMessage, finalValidationMessage, isValid: !validationMessage, isFinalReady: !finalValidationMessage, isDemo: isDemoScoringConfig(config), scaleCount: scales.length, validityScales, clinicalScales, connectedItems };
};

export const generateChartData = (scores: ScoreRow[]) => scores.map((score) => ({
  scale: score.code ?? score.scaleId,
  name: score.scaleName,
  group: score.type ?? score.group ?? 'other',
  rawScore: score.rawScore,
  tScore: score.tScore ?? null,
  plottedTScore: score.tScore ?? undefined,
  category: score.category,
}));
