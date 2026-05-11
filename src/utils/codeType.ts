import type { ScoreRow, ScoringConfig } from '../types';

const CLINICAL_CODES = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'hs', 'd', 'hy', 'pd', 'mf', 'pa', 'pt', 'sc', 'ma', 'si']);
const clinicalCode = (score: ScoreRow) => (score.code ?? score.scaleId).replace(/[^0-9A-Za-z]/g, '');
const isClinical = (score: ScoreRow) => (score.type ?? '').toLowerCase() === 'clinical' || CLINICAL_CODES.has(clinicalCode(score).toLowerCase());
const scoreLabel = (score: ScoreRow) => `${score.code ?? score.scaleId} (${score.scaleName}) T=${score.tScore ?? 'belum dikonversi'}`;

export interface CodeTypeResult {
  onePointCode?: string;
  twoPointCode?: string;
  threePointCode?: string;
  scales: ScoreRow[];
  interpretiveConfidence: 'tinggi' | 'terbatas' | 'tidak terdefinisi';
  clinicalThemes: string[];
  cautionNotes: string[];
  message: string;
  hasLicensedInterpretation: boolean;
}

export const generateCodeType = (scores: ScoreRow[], scoringConfig?: ScoringConfig | null): CodeTypeResult => {
  const rules = scoringConfig?.codeTypeRules;
  const minT = rules?.minTScore ?? 65;
  const minSep = rules?.minSeparation ?? 5;
  const candidates = scores
    .filter((score) => isClinical(score) && typeof score.tScore === 'number')
    .filter((score) => (rules?.includeScale5 || !['5', 'mf'].includes(clinicalCode(score).toLowerCase())) && (rules?.includeScale0 || !['0', 'si'].includes(clinicalCode(score).toLowerCase())))
    .sort((a, b) => (b.tScore ?? 0) - (a.tScore ?? 0));

  if (!candidates.length || (candidates[0].tScore ?? 0) < minT) {
    return { scales: [], interpretiveConfidence: 'tidak terdefinisi', clinicalThemes: [], cautionNotes: ['T-score klinis utama belum memenuhi batas minimal code type.'], message: 'Tidak ditemukan code type yang cukup terdefinisi; interpretasi difokuskan pada skala individual.', hasLicensedInterpretation: false };
  }

  const selected = candidates.slice(0, 3);
  const next = candidates[3];
  const separationOk = !next || ((selected[selected.length - 1].tScore ?? 0) - (next.tScore ?? 0)) >= minSep;
  const elevatedSelected = selected.filter((score) => (score.tScore ?? 0) >= minT);
  if (elevatedSelected.length < 2 || !separationOk) {
    return { onePointCode: clinicalCode(candidates[0]), scales: [candidates[0]], interpretiveConfidence: 'terbatas', clinicalThemes: [], cautionNotes: ['Pola puncak belum cukup terpisah dari skala berikutnya.'], message: 'Tidak ditemukan code type yang cukup terdefinisi; interpretasi difokuskan pada skala individual.', hasLicensedInterpretation: false };
  }

  const code = elevatedSelected.map(clinicalCode).join('-');
  const pairCode = elevatedSelected.slice(0, 2).map(clinicalCode).join('-');
  const licensed = rules?.interpretations?.[code] ?? rules?.interpretations?.[pairCode];
  return {
    onePointCode: clinicalCode(elevatedSelected[0]),
    twoPointCode: pairCode,
    threePointCode: elevatedSelected.length >= 3 ? code : undefined,
    scales: elevatedSelected,
    interpretiveConfidence: licensed ? 'tinggi' : 'terbatas',
    clinicalThemes: licensed?.themes ?? [`Code type terdeteksi secara numerik pada ${elevatedSelected.map(scoreLabel).join(', ')}.`],
    cautionNotes: licensed?.cautionNotes ?? ['Code type terdeteksi secara numerik, tetapi interpretasi spesifik belum tersedia pada konfigurasi auto-default.'],
    message: licensed?.summary ?? 'Code type terdeteksi secara numerik, tetapi interpretasi spesifik belum tersedia pada konfigurasi auto-default.',
    hasLicensedInterpretation: Boolean(licensed),
  };
};
