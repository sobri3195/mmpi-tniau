import type { Answers, ScoreRow, ScoringConfig } from '../types';

export const calculateTScore = (rawScore: number, scale: ScoringConfig['scales'][number]) => {
  if (!scale.norms?.length) return undefined;
  return scale.norms.find((norm) => norm.raw === rawScore)?.tScore;
};

export const calculateRawScores = (answers: Answers, scoringConfig: ScoringConfig): ScoreRow[] => {
  return scoringConfig.scales.map((scale) => {
    const rawScore = scale.items.reduce((total, item) => {
      const answer = answers[String(item.questionId)];
      return answer === item.scoredResponse ? total + Number(item.point || 0) : total;
    }, 0);
    const tScore = calculateTScore(rawScore, scale);
    const rule = scale.interpretationRules.find((item) => rawScore >= item.min && rawScore <= item.max);
    return {
      scaleId: scale.id,
      scaleName: scale.name,
      rawScore,
      tScore,
      category: rule?.label ?? 'Tidak tersedia',
      interpretation: rule?.description ?? 'Belum ada aturan interpretasi untuk rentang skor ini.',
      normStatus: tScore === undefined ? 'Belum dikonversi ke norma resmi' : 'Menggunakan tabel norma konfigurasi',
      type: scale.type ?? 'other',
    };
  });
};

export const generateInterpretations = (scores: ScoreRow[]) => scores.map((score) => ({
  scaleId: score.scaleId,
  label: score.category,
  description: score.interpretation,
}));

export const generateChartData = (scores: ScoreRow[]) => scores.map((score) => ({
  scale: score.scaleId,
  name: score.scaleName,
  rawScore: score.rawScore,
  tScore: score.tScore ?? 0,
}));

export const validateScoringConfig = (config: ScoringConfig | null) => {
  if (!config) return 'Konfigurasi scoring belum diimport.';
  if (!Array.isArray(config.scales) || config.scales.length === 0) return 'Konfigurasi scoring harus memiliki minimal satu skala.';
  const invalid = config.scales.find((scale) => !scale.id || !Array.isArray(scale.items) || !Array.isArray(scale.interpretationRules));
  return invalid ? `Skala ${invalid.id || '(tanpa ID)'} belum valid.` : '';
};
