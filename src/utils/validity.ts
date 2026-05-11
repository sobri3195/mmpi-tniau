import type { ScoreRow, ScoringConfig, ValidityStatus } from '../types';

const norm = (value?: string) => (value ?? '').toLowerCase().replace(/[^a-z0-9?]+/g, '');
const codeOf = (score: ScoreRow) => norm(score.code ?? score.scaleId);
const isValidity = (score: ScoreRow) => (score.type ?? score.group ?? '').toLowerCase() === 'validity';

const constructFor = (score: ScoreRow) => {
  const code = codeOf(score);
  if (code === '?' || code.includes('cannot')) return 'Cannot Say / item kosong';
  if (code.includes('vrin')) return 'random/inconsistent responding (VRIN)';
  if (code.includes('trin')) return 'fixed/random responding (TRIN)';
  if (['f', 'fb', 'fp', 'fbs'].includes(code) || code.includes('infrequency')) return 'over-reporting/symptom exaggeration atau distress berat';
  if (['l', 'k', 's'].includes(code) || code.includes('lie') || code.includes('defens')) return 'defensiveness/under-reporting';
  return 'indikator validitas';
};

export const summarizeValidityDomains = (scores: ScoreRow[]) => {
  const validityScores = scores.filter(isValidity);
  const elevated = validityScores.filter((score) => typeof score.tScore === 'number' && score.tScore >= 65);
  const flagText = (pattern: RegExp, fallback: string) => {
    const found = elevated.filter((score) => pattern.test(codeOf(score)));
    return found.length ? `Ada indikasi ${fallback} pada ${found.map((s) => s.code ?? s.scaleId).join(', ')}.` : `Tidak tampak peringatan mayor ${fallback} berdasarkan skala yang tersedia.`;
  };
  return [
    flagText(/vrin|trin/, 'inkonsistensi/random response'),
    flagText(/^f$|fb|fp|fbs|infrequency/, 'infrequency/over-reporting atau distress berat'),
    flagText(/^l$|^k$|^s$|lie|defens/, 'defensiveness/under-reporting'),
    flagText(/over|fbs|fp/, 'symptom exaggeration'),
    flagText(/cannot|kosong|tanya|^\?$/, 'Cannot Say/item kosong berlebih'),
  ];
};

export const determineProtocolValidity = (scores: ScoreRow[], scoringConfig?: ScoringConfig | null): ValidityStatus => {
  const validityScores = scores.filter(isValidity);
  if (!validityScores.length) {
    return {
      status: 'unknown',
      label: 'Validitas belum tersedia',
      reasons: ['Konfigurasi belum memuat skala validitas (?/VRIN/TRIN/F/Fb/Fp/FBS/L/K/S). Interpretasi memerlukan telaah profesional.'],
      canInterpretClinical: false,
      requiresRetest: false,
      flags: ['validity-missing'],
    };
  }

  const configScale = (score: ScoreRow) => scoringConfig?.scales.find((scale) => scale.id === score.scaleId);
  const isInvalid = (score: ScoreRow) => {
    const rule = configScale(score)?.validityRules;
    if (typeof score.tScore === 'number') return score.tScore >= (rule?.invalidTScore ?? 75);
    return /invalid|tidak valid|tinggi|high|retest/i.test(`${score.category} ${score.interpretation}`) || (rule?.invalidRaw !== undefined && score.rawScore >= rule.invalidRaw);
  };
  const isCaution = (score: ScoreRow) => {
    const rule = configScale(score)?.validityRules;
    if (typeof score.tScore === 'number') return score.tScore >= (rule?.cautionTScore ?? 65);
    return /caution|hati|waspada|elevated|perhatian/i.test(`${score.category} ${score.interpretation}`) || (rule?.cautionRaw !== undefined && score.rawScore >= rule.cautionRaw);
  };

  const invalidMarkers = validityScores.filter(isInvalid);
  const cautionMarkers = validityScores.filter((score) => !isInvalid(score) && isCaution(score));
  const reasons = [...invalidMarkers, ...cautionMarkers].map((score) => `${score.code ?? score.scaleId}: ${score.category} — ${constructFor(score)}`);

  if (invalidMarkers.length) {
    return {
      status: 'invalid',
      label: 'Invalid / perlu telaah atau tes ulang',
      reasons: reasons.length ? reasons : ['Profil respons belum memadai untuk interpretasi klinis final.'],
      canInterpretClinical: false,
      requiresRetest: true,
      flags: invalidMarkers.map(constructFor),
    };
  }
  if (cautionMarkers.length) {
    return {
      status: 'caution',
      label: 'Caution / perlu kehati-hatian',
      reasons,
      canInterpretClinical: true,
      requiresRetest: false,
      flags: cautionMarkers.map(constructFor),
    };
  }
  return {
    status: 'valid',
    label: 'Valid / dapat ditelaah',
    reasons: ['Tidak ada peringatan mayor pada skala validitas yang tersedia. Interpretasi klinis dapat dilanjutkan sebagai telaah awal dan tetap memerlukan konfirmasi profesional.'],
    canInterpretClinical: true,
    requiresRetest: false,
    flags: [],
  };
};
