import type { AssessmentResult, ScoreRow, ScoringConfig, ValidityStatus } from '../types';
import { generateCodeType, type CodeTypeResult } from './codeType';
import { isDemoScoringConfig } from './scoring';
import { summarizeValidityDomains } from './validity';

export const CLINICAL_DOMAIN_LABELS = [
  'Regulasi Emosi dan Distress',
  'Fungsi Kognitif dan Persepsi Realitas',
  'Somatisasi dan Keluhan Fisik',
  'Kontrol Impuls dan Perilaku',
  'Fungsi Interpersonal',
  'Fungsi Kerja dan Militer',
] as const;

const scoreValue = (score: ScoreRow) => score.tScore ?? -Infinity;
const elevated = (score: ScoreRow) => typeof score.tScore === 'number' && score.tScore >= 65;
const marked = (score: ScoreRow) => typeof score.tScore === 'number' && score.tScore >= 75;
const codeText = (score: ScoreRow) => `${score.code ?? score.scaleId} (${score.scaleName})`;
const normalize = (value: string) => value.toLowerCase();

const scoreMatches = (score: ScoreRow, patterns: string[]) => {
  const haystack = normalize(`${score.scaleId} ${score.code ?? ''} ${score.scaleName} ${score.interpretation}`);
  return patterns.some((pattern) => haystack.includes(pattern));
};

export const classifyDomain = (score: ScoreRow) => {
  if (scoreMatches(score, ['depress', 'anxiety', 'emas', 'demoral', 'pt', 'dysfunctional negative', 'negative emotional', 'rcd', 'rc2', 'rc7', 'd /'])) return 'Regulasi Emosi dan Distress';
  if (scoreMatches(score, ['schiz', 'psychotic', 'persecution', 'parano', 'aberrant', 'bizarre', 'sc', 'pa', 'rc6', 'rc8'])) return 'Fungsi Kognitif dan Persepsi Realitas';
  if (scoreMatches(score, ['somatic', 'health', 'hypochond', 'fatigue', 'pain', 'hs', 'rc1'])) return 'Somatisasi dan Keluhan Fisik';
  if (scoreMatches(score, ['antisocial', 'anger', 'hostil', 'hypoman', 'disconstraint', 'aggress', 'pd', 'ma', 'rc4', 'rc9'])) return 'Kontrol Impuls dan Perilaku';
  if (scoreMatches(score, ['social', 'introversion', 'family', 'cynic', 'mistrust', 'si', 'rc3'])) return 'Fungsi Interpersonal';
  if (scoreMatches(score, ['work', 'treatment', 'responsibility', 'dominance', 'ego strength'])) return 'Fungsi Kerja dan Militer';
  return 'Fungsi Kerja dan Militer';
};

export const buildDomainSummary = (scores: ScoreRow[]) => CLINICAL_DOMAIN_LABELS.map((domain) => {
  const domainScores = scores.filter((score) => score.type !== 'validity' && classifyDomain(score) === domain);
  const maxT = domainScores.reduce((max, score) => Math.max(max, score.tScore ?? 0), 0);
  const elevatedScores = domainScores.filter(elevated).sort((a, b) => scoreValue(b) - scoreValue(a));
  const narrative = elevatedScores.length
    ? `Terdapat indikasi area yang perlu dieksplorasi pada ${elevatedScores.map(codeText).join(', ')}. Temuan perlu dikonfirmasi melalui wawancara klinis, observasi, dan data pendukung.`
    : 'Tidak ditemukan elevasi bermakna pada skala yang tersedia untuk domain ini; tetap perlu mempertimbangkan konteks tugas, riwayat, dan observasi.';
  return { domain, maxT, scores: domainScores, elevatedScores, narrative };
});

export interface SpecialistReport {
  isDemo: boolean;
  executiveSummary: string;
  reviewStatus: string;
  validityNarrative: string;
  clinicalNarratives: { score: ScoreRow; meaning: string; explore: string; caution: string }[];
  domainSummaries: ReturnType<typeof buildDomainSummary>;
  codeType: CodeTypeResult;
  riskFlags: string[];
  initialImpression: string[];
  recommendations: string[];
  limitations: string[];
  appendix: { term: string; description: string }[];
  dominantScales: ScoreRow[];
}

export const generateSpecialistInterpretation = (resultOrScores: AssessmentResult | ScoreRow[], scoringConfig?: ScoringConfig | null): SpecialistReport => {
  const scores = Array.isArray(resultOrScores) ? resultOrScores : resultOrScores.scores;
  const validityStatus: ValidityStatus | undefined = Array.isArray(resultOrScores) ? undefined : resultOrScores.validityStatus;
  const isDemo = isDemoScoringConfig(scoringConfig) || (!Array.isArray(resultOrScores) && Boolean(resultOrScores.isDemoConfig));
  const validity = validityStatus ?? { status: 'unknown', label: 'Validitas belum tersedia', reasons: [], canInterpretClinical: false };
  const clinicalScores = scores.filter((score) => score.type !== 'validity');
  const dominantScales = [...clinicalScores].filter((score) => typeof score.tScore === 'number').sort((a, b) => scoreValue(b) - scoreValue(a)).slice(0, 5);
  const elevatedScales = dominantScales.filter(elevated);
  const domainSummaries = buildDomainSummary(scores);
  const elevatedDomains = domainSummaries.filter((item) => item.elevatedScores.length).map((item) => item.domain);
  const codeType = generateCodeType(scores, scoringConfig);

  const reviewStatus = validity.status === 'valid' ? 'Dapat ditelaah' : validity.status === 'caution' ? 'Perlu kehati-hatian' : 'Perlu review/retest';
  const topScale = dominantScales[0] ? codeText(dominantScales[0]) : 'tidak tersedia';
  const executiveSummary = isDemo
    ? 'Konfigurasi yang digunakan masih demo/placeholder. Laporan ini tidak valid untuk interpretasi klinis atau personel.'
    : `Profil respons menunjukkan status ${validity.label}. Skala yang paling menonjol adalah ${topScale}. Temuan utama berada pada domain ${elevatedDomains.join(', ') || 'tidak ada elevasi bermakna berdasarkan data yang tersedia'}. Hasil ini memerlukan konfirmasi melalui wawancara klinis dan data pendukung.`;

  const validityNarrative = validity.status === 'invalid'
    ? 'Profil respons belum memadai untuk interpretasi klinis final. Disarankan review manual/retest oleh profesional berwenang. Skor tetap ditampilkan dengan label interpretasi terbatas.'
    : `Berdasarkan profil validitas, hasil asesmen berada pada kategori ${validity.label}. ${summarizeValidityDomains(scores).join(' ')} Interpretasi klinis ${validity.status === 'caution' ? 'bersifat terbatas dan perlu kehati-hatian' : 'dapat dilakukan sebagai telaah awal'} serta perlu dikonfirmasi melalui wawancara klinis.`;

  const clinicalNarratives = validity.status === 'invalid' ? [] : clinicalScores.filter(elevated).map((score) => ({
    score,
    meaning: score.interpretation,
    explore: `Area yang perlu dieksplorasi: ${classifyDomain(score)}, onset/durasi keluhan, faktor pencetus, dampak fungsi kerja/interpersonal, dan riwayat psikososial.`,
    caution: 'Temuan ini tidak ekuivalen dengan diagnosis dan perlu dikonfirmasi melalui wawancara klinis serta data pendukung.',
  }));

  const riskFlags = [
    ...scores.filter(marked).map((score) => `${codeText(score)} markedly elevated; perlu evaluasi klinis segera oleh profesional berwenang.`),
    ...scores.filter((score) => elevated(score) && scoreMatches(score, ['self-harm', 'suicide', 'bunuh', 'bdi'])).map((score) => `${codeText(score)} terkait indikator self-harm; perlu evaluasi klinis segera oleh profesional berwenang.`),
    ...scores.filter((score) => elevated(score) && scoreMatches(score, ['substance', 'addiction', 'zat', 'alkohol'])).map((score) => `${codeText(score)} terkait indikator penyalahgunaan zat; perlu asesmen lanjutan.`),
    ...(validity.status === 'invalid' ? ['Respons invalid atau defensif/inkonsisten ekstrem; perlu review profesional/retest.'] : []),
  ];

  const recommendations = validity.status === 'invalid'
    ? ['Jangan buat kesimpulan klinis dari laporan otomatis ini.', 'Lakukan review manual atau retest.', 'Evaluasi kondisi saat tes, motivasi, pemahaman instruksi, kelelahan, atau defensiveness.']
    : validity.status === 'caution'
      ? ['Review manual protokol validitas.', 'Konfirmasi respons dengan wawancara klinis.', 'Pertimbangkan retest jika indikator validitas tetap meragukan.']
      : riskFlags.length || elevatedScales.some(marked)
        ? ['Evaluasi psikolog klinis/psikiater.', 'Pendalaman riwayat gejala dan pertimbangkan asesmen risiko.', 'Jangan ambil keputusan tunggal dari laporan otomatis.']
        : elevatedScales.length
          ? ['Wawancara klinis terarah.', 'Pemeriksaan psikologis tambahan bila perlu.', 'Monitoring kondisi emosional/stres kerja.']
          : ['Dapat dilanjutkan sesuai prosedur institusi.', 'Tetap pertimbangkan wawancara, observasi, dan riwayat psikososial.'];

  const limitations = [
    'Kesan ini bersifat awal dan tidak menggantikan pemeriksaan klinis.',
    'Sistem tidak menyertakan soal, norma, atau kunci scoring MMPI proprietari; akurasi bergantung pada konfigurasi resmi/berizin yang diimpor admin.',
    'Hasil ini tidak boleh digunakan sebagai satu-satunya dasar diagnosis, keputusan kelayakan, penempatan, atau tindakan administratif. Keputusan akhir harus dibuat oleh profesional dan otoritas berwenang berdasarkan asesmen komprehensif.',
    ...scores.filter((score) => score.tScore === undefined).map((score) => `${codeText(score)} belum dikonversi ke norma resmi sehingga tidak boleh diinterpretasikan klinis kuat.`),
  ];

  const initialImpression = [
    `Validitas profil: ${validity.label}.`,
    `Temuan utama: ${elevatedScales.length ? elevatedScales.map(codeText).join(', ') : 'tidak ditemukan elevasi bermakna berdasarkan data yang tersedia'}.`,
    `Skala dominan: ${dominantScales.length ? dominantScales.map(codeText).join(', ') : 'tidak tersedia'}.`,
    `Domain yang perlu dieksplorasi: ${elevatedDomains.join(', ') || 'tidak ada domain elevated berbasis norma yang tersedia'}.`,
    `Faktor yang membatasi interpretasi: ${limitations[1]}`,
    'Kesimpulan: Kesan ini bersifat awal dan tidak menggantikan pemeriksaan klinis.',
  ];

  const appendix = [
    { term: 'Raw Score', description: 'Jumlah respons yang memenuhi kunci scoring pada suatu skala sebelum dikonversi ke norma resmi/berizin.' },
    { term: 'T-score', description: 'Skor standar berbasis norma. T-score 50 biasanya mewakili rata-rata normatif; interpretasi klinis memerlukan norma resmi instrumen.' },
    { term: 'Batas T-score', description: 'Aturan umum: T < 50 rendah, 50–59 rata-rata, 60–64 borderline/waspada, 65–74 clinically elevated, dan ≥75 markedly elevated, kecuali konfigurasi resmi memberi aturan berbeda.' },
    { term: 'Skala validitas', description: 'Membantu menilai Cannot Say, VRIN/TRIN, infrequency, defensiveness, under-reporting, over-reporting, dan konsistensi respons.' },
    { term: 'Skala klinis', description: 'Sepuluh skala klinis utama MMPI-2 dibaca sebagai indikasi area eksplorasi, bukan diagnosis final.' },
    { term: 'RC Scales', description: 'Jika tersedia, RC scales membantu memetakan demoralization, somatic complaints, low positive emotions, cynicism, antisocial behavior, ideas of persecution, dysfunctional negative emotions, aberrant experiences, dan hypomanic activation.' },
    { term: 'Content/Supplementary/PSY-5', description: 'Jika tersedia, skala tambahan memperkaya telaah domain kecemasan, depresi, kesehatan, kemarahan, kerja, PTSD-related indicators, addiction potential, agresivitas, psychoticism, disconstraint, negative emotionality, dan introversion.' },
    { term: 'Code Type', description: 'Code type dibuat hanya bila puncak skala klinis memenuhi batas T-score dan pemisahan yang cukup. Interpretasi spesifik hanya digunakan jika admin mengimpor rule berizin.' },
    { term: 'Keterbatasan laporan', description: 'Raw score tanpa T-score resmi diberi badge norma belum tersedia dan tidak boleh digunakan untuk klaim klinis kuat.' },
    { term: 'Disclaimer klinis', description: 'Hasil otomatis bukan diagnosis final dan harus dikonfirmasi oleh psikolog klinis, psikiater, atau pemeriksa berwenang.' },
    { term: 'Disclaimer personel/militer', description: 'Keputusan administratif/personel harus dibuat oleh tim berwenang dengan mempertimbangkan hasil klinis, wawancara, rekam medis, observasi, dan standar institusi.' },
  ];

  return { isDemo, executiveSummary, reviewStatus, validityNarrative, clinicalNarratives, domainSummaries, codeType, riskFlags, initialImpression, recommendations, limitations, appendix, dominantScales };
};
