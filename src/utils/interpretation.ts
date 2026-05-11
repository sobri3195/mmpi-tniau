import type { AssessmentResult, ScoreRow, ScoringConfig } from '../types';
import { generateSpecialistInterpretation as generateReport } from './reportGenerator';

const ELEVATED_T_SCORE = 65;
const BORDERLINE_T_SCORE = 60;
const normalize = (value: string) => value.toLowerCase();
const hasCategory = (score: ScoreRow, keywords: string[]) => keywords.some((keyword) => normalize(`${score.category} ${score.interpretation}`).includes(keyword));

export const isElevatedScore = (score: ScoreRow) => typeof score.tScore === 'number' ? score.tScore >= ELEVATED_T_SCORE : hasCategory(score, ['tinggi', 'elevated', 'bermakna', 'signifikan', 'risiko']);
export const isBorderlineScore = (score: ScoreRow) => typeof score.tScore === 'number' ? score.tScore >= BORDERLINE_T_SCORE && score.tScore < ELEVATED_T_SCORE : hasCategory(score, ['sedang', 'borderline', 'waspada', 'perlu perhatian']);
export const getScoreTone = (score: ScoreRow): 'teal' | 'amber' | 'rose' | 'slate' => {
  if (isElevatedScore(score)) return 'rose';
  if (isBorderlineScore(score)) return 'amber';
  if (hasCategory(score, ['rendah', 'normal', 'adaptif', 'minimal', 'rata-rata'])) return 'teal';
  return 'slate';
};

export type SpecialistInterpretation = ReturnType<typeof generateReport>;
export const generateSpecialistInterpretation = (resultOrScores: AssessmentResult | ScoreRow[], scoringConfig?: ScoringConfig | null) => generateReport(resultOrScores, scoringConfig);
