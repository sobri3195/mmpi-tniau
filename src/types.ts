export type AnswerValue = boolean | string | number;

export type ResponseType = 'true_false' | 'yes_no';

export interface QuestionOption {
  label: string;
  value: AnswerValue;
}

export interface Question {
  id: number;
  code: string;
  text: string;
  responseType: ResponseType;
  options: QuestionOption[];
  required: boolean;
}

export interface ScoringItem {
  questionId: number;
  scoredResponse: AnswerValue;
  point: number;
}

export interface InterpretationRule {
  min: number;
  max: number;
  label: string;
  description: string;
  riskFlag?: string;
  domain?: string;
}

export interface NormConversion {
  raw: number;
  tScore: number;
}

export type ScaleGroup = 'validity' | 'clinical' | 'rc' | 'content' | 'supplementary' | 'psy5' | 'other';

export interface ScaleConfig {
  id: string;
  code?: string;
  name: string;
  description?: string;
  type?: ScaleGroup | string;
  group?: ScaleGroup | string;
  items: ScoringItem[];
  interpretationRules?: InterpretationRule[];
  norms?: NormConversion[];
  tScoreConversion?: NormConversion[];
  validityRules?: {
    cautionTScore?: number;
    invalidTScore?: number;
    cautionRaw?: number;
    invalidRaw?: number;
    direction?: 'high' | 'low';
    construct?: 'consistency' | 'infrequency' | 'defensiveness' | 'over-reporting' | 'under-reporting' | 'cannot-say' | 'random';
  };
}

export interface CodeTypeRules {
  includeScale5?: boolean;
  includeScale0?: boolean;
  minTScore?: number;
  minSeparation?: number;
  interpretations?: Record<string, { summary: string; themes?: string[]; cautionNotes?: string[] }>;
}

export interface ScoringConfig {
  instrumentName: string;
  version: string;
  scales: ScaleConfig[];
  codeTypeRules?: CodeTypeRules;
  tScoreRules?: {
    lowMax?: number;
    normalMin?: number;
    normalMax?: number;
    borderlineMin?: number;
    borderlineMax?: number;
    elevatedMin?: number;
    elevatedMax?: number;
    markedlyElevatedMin?: number;
  };
  [key: string]: unknown;
}

export interface ValidityStatus {
  status: 'valid' | 'caution' | 'invalid' | 'unknown';
  label: string;
  reasons: string[];
  canInterpretClinical?: boolean;
  requiresRetest?: boolean;
  flags?: string[];
}

export interface ParticipantIdentity {
  name: string;
  participantNumber?: string;
  dateOfBirth: string;
  age: string;
  gender: string;
  maritalStatus: string;
  education: string;
  occupation: string;
  originWorkUnit: string;
  unit: string;
  assessmentDate: string;
  consent: boolean;
}

export type Answers = Record<string, AnswerValue>;

export type AccessTokenStatus = 'unused' | 'active' | 'completed' | 'expired' | 'revoked';

export interface AccessToken {
  tokenId: string;
  token: string;
  uniqueKey: string;
  participantName: string;
  participantNumber: string;
  unit: string;
  createdAt: string;
  expiresAt: string;
  status: AccessTokenStatus;
  maxAttempts: number;
  usedAttempts: number;
  startedAt: string | null;
  completedAt: string | null;
  resultId: string | null;
  notes: string;
}

export interface TokenSessionBinding {
  sessionId: string;
  tokenId: string;
  token: string;
  uniqueKey: string;
  participant: Partial<ParticipantIdentity>;
  answers: Answers;
  startedAt: string;
  lastSavedAt: string;
  status: 'in_progress' | 'completed';
}

export interface CurrentSession {
  id: string;
  sessionId?: string;
  tokenId?: string;
  token?: string;
  uniqueKey?: string;
  participant?: Partial<ParticipantIdentity>;
  identity: ParticipantIdentity;
  answers: Answers;
  currentIndex: number;
  mode: 'single' | 'list';
  status: 'Draft' | 'Selesai' | 'Perlu Review' | 'in_progress';
  startedAt?: string;
  lastSavedAt?: string;
  updatedAt: string;
}

export interface ScoreRow {
  scaleId: string;
  scaleName: string;
  rawScore: number;
  tScore?: number;
  category: string;
  interpretation: string;
  normStatus: string;
  type?: string;
  group?: string;
  code?: string;
  elevationLevel?: string;
  note?: string;
}


export type SpecialistReviewStatus = 'pending' | 'reviewed' | 'retest_required' | 'interview_required' | 'referred' | 'finalized';

export interface SpecialistReview {
  status: SpecialistReviewStatus;
  reviewerId: string;
  reviewerName: string;
  reviewerTitle: string;
  licenseNumber: string;
  reviewedAt: string;
  validityNotes: string;
  clinicalImpression: string;
  riskNotes: string;
  recommendations: string;
  limitations: string;
  finalConclusion: string;
  isLocked: boolean;
}

export interface AssessmentResult {
  id: string;
  identity: ParticipantIdentity;
  answers: Answers;
  answeredCount: number;
  totalQuestions: number;
  submittedAt: string;
  startedAt?: string;
  durationLabel?: string;
  scores: ScoreRow[];
  status: 'Selesai' | 'Perlu Review';
  specialistReview?: SpecialistReview;
  validityStatus?: ValidityStatus;
  interpretations?: { scaleId: string; label: string; description: string }[];
  clinicalSummary?: string;
  recommendations?: string[];
  isDemoConfig?: boolean;
}
