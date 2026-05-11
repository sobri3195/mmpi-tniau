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
}

export interface NormConversion {
  raw: number;
  tScore: number;
}

export interface ScaleConfig {
  id: string;
  code?: string;
  name: string;
  description: string;
  type?: 'validity' | 'clinical' | 'content' | 'other';
  group?: 'validity' | 'clinical' | 'content' | 'other';
  items: ScoringItem[];
  interpretationRules: InterpretationRule[];
  norms?: NormConversion[];
  tScoreConversion?: NormConversion[];
}

export interface ValidityStatus {
  status: 'valid' | 'caution' | 'invalid' | 'unknown';
  label: string;
  reasons: string[];
}

export interface ScoringConfig {
  instrumentName: string;
  version: string;
  scales: ScaleConfig[];
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

export interface CurrentSession {
  id: string;
  identity: ParticipantIdentity;
  answers: Answers;
  currentIndex: number;
  mode: 'single' | 'list';
  status: 'Draft' | 'Selesai' | 'Perlu Review';
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
  code?: string;
}

export interface AssessmentResult {
  id: string;
  identity: ParticipantIdentity;
  answers: Answers;
  answeredCount: number;
  totalQuestions: number;
  submittedAt: string;
  scores: ScoreRow[];
  status: 'Selesai' | 'Perlu Review';
  validityStatus?: ValidityStatus;
  interpretations?: { scaleId: string; label: string; description: string }[];
  clinicalSummary?: string;
  recommendations?: string[];
}
