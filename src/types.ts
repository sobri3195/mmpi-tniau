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
  batchId?: string;
  singleActiveSessionOnly?: boolean;
  activeSessionId?: string | null;
  deviceHistory?: Array<{ at: string; userAgent: string; note: string }>;
  revokedAt?: string;
  revokedBy?: string;
}


export interface SourceInterpretationConfig {
  sourceName: 'Rusdi Maslim' | 'Hubertus' | string;
  version: string;
  isDemo: boolean;
  isAutoDefault?: boolean;
  isOfficial?: boolean;
  isVerified?: boolean;
  licenseStatus?: string;
  createdAt?: string;
  verifiedAt?: string;
  officialMarkedAt?: string;
  disclaimer?: string;
  validityInterpretations: Record<string, unknown>;
  scaleInterpretations: Record<string, unknown>;
  codeTypeInterpretations?: Record<string, unknown>;
  domainInterpretations: Record<string, unknown>;
  recommendationRules: Record<string, unknown> | unknown[];
  appendix: Record<string, unknown>;
}

export interface SourceCodeTypeConfig {
  sourceName: 'Rusdi Maslim' | 'Hubertus' | string;
  version: string;
  isAutoDefault?: boolean;
  isOfficial?: boolean;
  rules: unknown[];
  message: string;
}

export interface SourceInterpretationResult {
  available: boolean;
  source: 'Rusdi Maslim' | 'Hubertus' | string;
  message?: string;
  isDemo?: boolean;
  isAutoDefault?: boolean;
  isOfficial?: boolean;
  disclaimer?: string;
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
  status: 'in_progress' | 'completed' | SessionWorkflowStatus;
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
  status: 'Draft' | 'Selesai' | 'Perlu Review' | 'in_progress' | SessionWorkflowStatus;
  mmpiStatus?: SessionWorkflowStatus;
  rhStatus?: RHStatus;
  rhStartedAt?: string;
  rhSubmittedAt?: string;
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


export interface SummaryAnalysisVariableConfig {
  id: string;
  label: string;
  englishLabel?: string;
  rangeDescription?: string;
  formula?: string;
  sourceScales?: string[];
  autoRule?: string;
  fallbackValue?: number | null;
}

export interface SummaryAnalysisCategoryRule { min: number; max: number; label: string; }
export interface SummaryAnalysisScoreRule { score: number; label: string; description: string; }

export interface SummaryAnalysisConfig {
  configName: string;
  version: string;
  source?: string;
  isDemo: boolean;
  isAutoDefault?: boolean;
  isOfficial?: boolean;
  isFinal?: boolean;
  licenseStatus?: string;
  createdAt?: string;
  disclaimer?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNote?: string;
  validityAttitude?: {
    title?: string;
    sourceScales?: string[];
    scoreRules?: SummaryAnalysisScoreRule[];
    narrativeTemplates?: Record<string, string>;
  };
  mentalCapacityIndex?: {
    title?: string;
    isAutoDefault?: boolean;
    variables?: SummaryAnalysisVariableConfig[];
    totalScore?: { min: number; max: number; label: string };
    categoryRules?: SummaryAnalysisCategoryRule[];
  };
  clinicalProfile?: {
    title?: string;
    isAutoDefault?: boolean;
    sourceScales?: string[];
    narrativeRules?: Array<{ domain?: string; condition?: string; text: string; sourceScales?: string[]; minTScore?: number; maxTScore?: number; minRaw?: number; maxRaw?: number; formula?: string }>;
    noElevationText?: string;
  };
  basicPersonalityIndex?: {
    title?: string;
    name?: string;
    model?: string;
    isAutoDefault?: boolean;
    variables?: SummaryAnalysisVariableConfig[];
    totalScore?: { min: number; max: number; label: string };
    categoryRules?: SummaryAnalysisCategoryRule[];
  };
  conclusionTemplates?: { valid?: string; caution?: string; invalid?: string; pending?: string };
  suggestionTemplates?: { no_elevation?: string; moderate_elevation?: string; high_elevation?: string; rh_redflag?: string };
  appendix?: Record<string, string>;
}

export interface SummaryAnalysisValidationResult { valid: boolean; errors: string[]; warnings: string[]; structurallyValid?: boolean; formulaAvailable?: boolean; sourceScalesChecked?: boolean; clinicallyOfficial?: boolean; status?: string; message?: string; }
export interface SummaryAnalysisVariableResult { id: string; label: string; englishLabel?: string; value: number | null; rangeDescription: string; category?: string; warning?: string; isAutoDefault?: boolean; }

export interface SummaryAnalysisResult {
  available: boolean;
  isDemo: boolean;
  isAutoDefault?: boolean;
  config?: SummaryAnalysisConfig;
  badgeLabel?: string;
  disclaimer?: string;
  message?: string;
  validationWarnings?: string[];
  testAttitude: { score: number | null; label: string; narrative: string; warnings?: string[] };
  mentalCapacityIndex: { variables: SummaryAnalysisVariableResult[]; total: number | null; category: string; warnings?: string[] };
  clinicalProfileSummary: { narratives: string[]; redFlags: string[]; warnings?: string[] };
  basicPersonalityIndex: { variables: SummaryAnalysisVariableResult[]; total: number | null; category: string; warnings?: string[] };
  conclusionAndSuggestion: { conclusion: string; suggestion: string };
}
export interface ConfigVersionsUsed {
  questionsVersionId: string;
  scoringConfigVersionId: string;
  normTableVersionId: string;
  rusdiInterpretationVersionId: string;
  hubertusInterpretationVersionId: string;
  summaryAnalysisVersionId: string;
  reportTemplateVersionId: string;
}
export type ReportWorkflowStatus = 'draft_result' | 'pending_scoring' | 'awaiting_rh' | 'awaiting_operator_verification' | 'awaiting_specialist_review' | 'needs_revision' | 'awaiting_final_approval' | 'finalized' | 'archived';
export interface WorkflowState { status: ReportWorkflowStatus; operatorVerifiedBy: string; operatorVerifiedAt: string; specialistReviewedBy: string; specialistReviewedAt: string; finalApprovedBy: string; finalApprovedAt: string; revisionNotes: Array<{ by: string; at: string; note: string }>; history: Array<{ by: string; at: string; from: string; to: string; note: string }>; }
export interface ClinicalFinalizationChecklist { identityVerified: boolean; answersComplete: boolean; durationReviewed: boolean; validityReviewed: boolean; redFlagsReviewed: boolean; rhCompared: boolean; rusdiReviewed: boolean; hubertusReviewed: boolean; summaryAnalysisReviewed: boolean; manualConclusionAdded: boolean; disclaimerIncluded: boolean; completedBy: string; completedAt: string; }
export interface FinalSignatureMetadata { signedByUserId: string; signedByName: string; role: string; licenseNumber: string; signedAt: string; reportHash: string; signatureStatement: string; isLocked: boolean; }

export interface AssessmentResult {
  id: string;
  resultId?: string;
  tokenId?: string;
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
    status?: 'pending_rh' | 'completed';
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
  rhFormId?: string;
  rhCompleted?: boolean;
  rhSummary?: RHSummary;
  summaryAnalysis?: SummaryAnalysisResult;
  configVersionsUsed?: ConfigVersionsUsed;
  workflow?: WorkflowState;
  clinicalFinalizationChecklist?: ClinicalFinalizationChecklist;
  finalSignature?: FinalSignatureMetadata;
}



export type SessionWorkflowStatus = 'mmpi_in_progress' | 'mmpi_completed_pending_rh' | 'rh_in_progress' | 'rh_completed' | 'completed';
export type RHStatus = 'not_started' | 'in_progress' | 'completed';
export type YesNo = '' | 'Ya' | 'Tidak';

export interface RHHealthItem {
  no: number;
  complaint: string;
  answer: YesNo;
  note: string;
  hospitalization?: {
    date: string;
    place: string;
    duration: string;
    disease: string;
  };
}

export interface RHForm {
  rhFormId: string;
  resultId: string;
  tokenId: string;
  participantId: string;
  createdAt: string;
  submittedAt: string;
  status: 'draft' | 'completed';
  consent: {
    noTest: string;
    name: string;
    birthPlaceDate: string;
    unit: string;
    homeAddress: string;
    phone: string;
    institutionRequest: string;
    statementAccepted: boolean;
    createdPlace: string;
    createdDate: string;
    signatureName: string;
  };
  identity: {
    fullName: string;
    birthPlace: string;
    birthDateInput: string;
    birthDateISO: string;
    homeAddress: string;
    phone: string;
    religion: string;
    gender: string;
    examPurpose: string;
  };
  healthHistory: {
    items: RHHealthItem[];
    physicalCondition: string;
    mentalCondition: string;
    routineMedication: { answer: YesNo; medicineType: string; startDate: string };
    sleepDifficulty: { answer: YesNo; needsMedication: YesNo };
  };
  educationHistory: Array<{ education: string; schoolName: string; years: string; graduationStatus: string }>;
  workHistory: Array<{ workplace: string; year: string; description: string }>;
  workQuestions: {
    hasWorkDifficulty: YesNo;
    workDifficultyExplanation: string;
    positiveAspects: string;
    negativeAspects: string;
    willingToWork: YesNo;
    willingToWorkExplanation: string;
  };
  familyHistory: {
    spouses: Array<{ name: string; education: string; description: string }>;
    children: Array<{ name: string; education: string; description: string }>;
    livingWithFamily: YesNo;
    livingWithFamilyReason: string;
    hasFamilyProblem: YesNo;
    familyProblemExplanation: string;
    spouseSupportsCareer: YesNo;
    spouseSupportExplanation: string;
  };
  socialHistory: {
    hasSeriousProblem: YesNo;
    seriousProblemExplanation: string;
    receivedTreatmentForProblem: YesNo;
    makingFriendsStyle: string;
    difficultyWithFamily: YesNo;
    difficultyWithSchoolFriends: YesNo;
    difficultyWithCoworkers: YesNo;
    freeTimeActivities: string;
    substanceUseHistory: YesNo;
    substanceUseExplanation?: string;
    legalProblemHistory: YesNo;
    legalProblemExplanation?: string;
  };
  riskFlags: string[];
  reviewNotes: string;
}

export interface RHSummary {
  hasMedicalRedFlags: boolean;
  hasPsychiatricRedFlags: boolean;
  hasSubstanceHistory: boolean;
  hasLegalHistory: boolean;
  needsSpecialistReview: boolean;
}
