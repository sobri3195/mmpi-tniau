export type AnswerValue = '+' | '-';

export type ResponseType = 'plus_minus';

export interface QuestionOption {
  label: string;
  value: AnswerValue;
}

export interface Question {
  id: number;
  number?: number;
  order?: number;
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
  birthDateInput?: string;
  birthDateISO?: string;
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
  status: AccessTokenStatus;
  createdAt: string;
  expiresAt: string;
  participantName?: string;
  participantNumber?: string;
  unit?: string;
  maxAttempts?: number;
  usedAttempts?: number;
  startedAt?: string | null;
  completedAt?: string | null;
  resultId?: string | null;
  notes?: string;
}

export interface SourceInterpretationConfig {
  sourceName: 'Rusdi Maslim' | 'Hubertus' | string;
  version: string;
  isDemo: boolean;
  validityInterpretations: Record<string, unknown>;
  scaleInterpretations: Record<string, unknown>;
  codeTypeInterpretations: Record<string, unknown>;
  domainInterpretations: Record<string, unknown>;
  recommendationRules: Record<string, unknown>;
  appendix: Record<string, unknown>;
}

export interface SourceInterpretationResult {
  available: boolean;
  source: 'Rusdi Maslim' | 'Hubertus' | string;
  message?: string;
  isDemo?: boolean;
  validityNarrative: string;
  clinicalNarrative: string;
  codeTypeNarrative: string;
  domainNarrative: string;
  recommendations: string[];
  appendix: Record<string, unknown>;
}

export interface InterpretationComparison {
  similarities: string[];
  differences: string[];
  cautionNotes: string[];
  specialistRequired: boolean;
}

export interface DualInterpretations {
  rusdiMaslim: SourceInterpretationResult;
  hubertus: SourceInterpretationResult;
  comparison: InterpretationComparison;
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
  startedDate?: string;
  startedTime?: string;
  submittedAt?: string;
  submittedDate?: string;
  submittedTime?: string;
  durationSeconds?: number;
  durationText?: string;
  questionOrder?: number[];
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
  selectedFinalInterpretation?: 'rusdi_maslim' | 'hubertus' | 'combined_professional_review' | 'not_selected' | 'further_interview' | 'retest_required' | 'referral_required';
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
  resultId?: string;
  identity: ParticipantIdentity;
  participant?: ParticipantIdentity;
  assessment?: {
    instrument: 'MMPI' | string;
    totalItems: number;
    answerFormat: 'plus_minus' | string;
    startedAt?: string;
    startedDate?: string;
    startedTime?: string;
    submittedAt: string;
    submittedDate: string;
    submittedTime: string;
    durationSeconds: number;
    durationText: string;
  };
  answers: Answers;
  answeredCount: number;
  totalQuestions: number;
  submittedAt: string;
  submittedDate?: string;
  submittedTime?: string;
  startedAt?: string;
  startedDate?: string;
  startedTime?: string;
  durationSeconds?: number;
  durationText?: string;
  durationLabel?: string;
  scores: ScoreRow[];
  status: 'Selesai' | 'Perlu Review';
  specialistReview?: SpecialistReview;
  validityStatus?: ValidityStatus;
  interpretations?: DualInterpretations;
  clinicalSummary?: string;
  recommendations?: string[];
  isDemoConfig?: boolean;
}
