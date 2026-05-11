import type { Question, ScaleConfig, ScoringConfig } from '../types';
import { ANSWER_VALUES, REQUIRED_TOTAL_QUESTIONS, isAnswerValue } from './answerFormat';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const DEMO_TERMS = ['demo', 'sample', 'placeholder', 'clinical_demo', 'validity_l demo'];
export const SUPPORTED_SCALE_GROUPS = ['validity', 'clinical', 'rc', 'content', 'supplementary', 'psy5'];

const emptyResult = (): ValidationResult => ({ valid: true, errors: [], warnings: [] });
const hasDemoText = (value: unknown) => DEMO_TERMS.some((term) => String(value ?? '').toLowerCase().includes(term));
export const isDemoLikeConfig = (config: unknown) => hasDemoText(JSON.stringify(config ?? {}));
export const scaleGroup = (scale: ScaleConfig) => String(scale.group ?? scale.type ?? 'other').toLowerCase();

export const validateQuestions = (questions: unknown): ValidationResult => {
  const result = emptyResult();
  if (!Array.isArray(questions)) {
    result.errors.push('Bank soal harus berupa array.');
    result.valid = false;
    return result;
  }
  if (questions.length !== REQUIRED_TOTAL_QUESTIONS) result.warnings.push(`Jumlah soal harus ${REQUIRED_TOTAL_QUESTIONS}; saat ini ${questions.length}.`);
  const ids = new Set<number>();
  const numbers = new Set<number>();
  questions.forEach((question, index) => {
    const q = question as Partial<Question>;
    if (!Number.isFinite(Number(q.id))) result.errors.push(`Item baris ${index + 1} tidak punya id numerik.`);
    if (ids.has(Number(q.id))) result.errors.push(`ID soal duplikat: ${q.id}.`);
    ids.add(Number(q.id));
    const rawNumber = (q as Partial<Question>).number ?? (q as Partial<Question>).order;
    const numericNumber = Number(rawNumber);
    if (!Number.isFinite(numericNumber) || numericNumber <= 0) result.warnings.push(`Item ${q.id ?? index + 1} tidak punya nomor/order; sistem akan memakai urutan array ${index + 1}.`);
    else if (numbers.has(numericNumber)) result.warnings.push(`Nomor soal duplikat: ${numericNumber}.`);
    if (Number.isFinite(numericNumber) && numericNumber > 0) numbers.add(numericNumber);
    if (!String(q.code ?? '').trim()) result.errors.push(`Item ${q.id ?? index + 1} tidak punya code.`);
    if (!String(q.text ?? '').trim()) result.errors.push(`Item ${q.id ?? index + 1} tidak punya text.`);
    if (String(q.responseType) !== 'plus_minus') result.errors.push(`Item ${q.id ?? index + 1} punya responseType tidak valid; wajib plus_minus.`);
    const options = q.options ?? [];
    const values = new Set(options.map((option) => option.value));
    const labels = new Set(options.map((option) => String(option.label ?? '').trim()));
    const optionsValid = ANSWER_VALUES.every((value) => values.has(value) && labels.has(value)) && options.length === 2;
    if (!optionsValid) result.errors.push(`Item ${q.id ?? index + 1} wajib memiliki tepat dua opsi dengan label/value "+" dan "-".`);
  });
  result.valid = result.errors.length === 0;
  return result;
};

export const validateScoringConfigAdmin = (config: unknown, questions: Question[] = []): ValidationResult => {
  const result = emptyResult();
  const cfg = config as ScoringConfig | null;
  if (!cfg || typeof cfg !== 'object') {
    result.errors.push('scoringConfig harus berupa object JSON.');
    result.valid = false;
    return result;
  }
  if (!('instrument' in cfg) && !('instrumentName' in cfg)) result.errors.push('Harus punya field instrument.');
  if (Number((cfg as { totalItems?: number }).totalItems) !== REQUIRED_TOTAL_QUESTIONS) result.errors.push(`Harus punya field totalItems: ${REQUIRED_TOTAL_QUESTIONS}.`);
  if (!Array.isArray(cfg.scales) || cfg.scales.length === 0) result.errors.push('Harus punya array scales.');
  const scales = Array.isArray(cfg.scales) ? cfg.scales : [];
  const questionIds = new Set(questions.map((q) => q.id));
  const missingQuestionIds: string[] = [];
  scales.forEach((scale) => {
    if (!scale.id) result.errors.push('Setiap scale harus punya id.');
    if (!scale.code) result.errors.push(`Scale ${scale.id ?? '(tanpa id)'} harus punya code.`);
    if (!scale.name) result.errors.push(`Scale ${scale.id ?? '(tanpa id)'} harus punya name.`);
    if (!scale.group) result.errors.push(`Scale ${scale.id ?? '(tanpa id)'} harus punya group.`);
    if (!Array.isArray(scale.items)) result.errors.push(`Scale ${scale.id ?? '(tanpa id)'} harus punya items.`);
    if (hasDemoText(scale.id) || hasDemoText(scale.code) || hasDemoText(scale.name)) result.warnings.push('Konfigurasi perlu diverifikasi sebelum dipakai untuk laporan final.');
    (scale.items ?? []).forEach((item) => {
      if (!Number.isFinite(Number(item.questionId))) result.errors.push(`Scale ${scale.id} memiliki questionId tidak valid.`);
      if (!isAnswerValue(item.scoredResponse)) result.errors.push(`Scale ${scale.id} questionId ${item.questionId} wajib memakai scoredResponse "+" atau "-".`);
      if (questions.length && !questionIds.has(Number(item.questionId))) missingQuestionIds.push(`${scale.code ?? scale.id}: ${item.questionId}`);
    });
  });
  const groups = new Set(scales.map(scaleGroup));
  SUPPORTED_SCALE_GROUPS.forEach((group) => {
    if (!groups.has(group)) result.warnings.push(`Group skala ${group} belum tersedia.`);
  });
  if (missingQuestionIds.length) result.errors.push(`questionId tidak ditemukan di bank soal: ${missingQuestionIds.slice(0, 25).join(', ')}${missingQuestionIds.length > 25 ? ' ...' : ''}`);
  result.valid = result.errors.length === 0;
  return result;
};

const normEntries = (norm: unknown) => Array.isArray(norm) ? norm : Object.values((norm as Record<string, unknown>) ?? {});
export const getNormScaleKeys = (norm: unknown) => new Set(normEntries(norm).map((entry) => String((entry as { scaleId?: string; code?: string; scaleCode?: string }).scaleId ?? (entry as { code?: string }).code ?? (entry as { scaleCode?: string }).scaleCode ?? '')).filter(Boolean));

export const validateNormTable = (norm: unknown, config?: ScoringConfig | null): ValidationResult => {
  const result = emptyResult();
  const entries = normEntries(norm);
  if (!entries.length) result.errors.push('normTable harus berisi tabel konversi raw score ke T-score.');
  entries.forEach((entry, index) => {
    const row = entry as Record<string, unknown>;
    if (!row.scaleId && !row.code && !row.scaleCode) result.errors.push(`Norma baris ${index + 1} harus terhubung ke scaleId atau code skala.`);
    if (!row.conversions && !row.table && row.raw === undefined && row.tScore === undefined) result.errors.push(`Norma baris ${index + 1} harus berisi konversi raw score ke T-score.`);
    if (!row.gender && !row.ageRange && !row.age && !row.general) result.warnings.push(`Norma ${String(row.scaleId ?? row.code ?? index + 1)} belum menjelaskan gender/usia/norma umum.`);
  });
  if (config?.scales?.length) {
    const keys = getNormScaleKeys(norm);
    const without = config.scales.filter((scale) => !keys.has(scale.id) && !keys.has(scale.code ?? ''));
    without.forEach((scale) => result.warnings.push(`${scale.code ?? scale.id}: Belum ada norma T-score.`));
  }
  result.valid = result.errors.length === 0;
  return result;
};

export const validateInterpretationConfig = (config: unknown): ValidationResult => {
  const result = emptyResult();
  const cfg = (config ?? {}) as Record<string, unknown>;
  ['scaleInterpretations', 'validityInterpretations', 'generalRecommendations'].forEach((field) => {
    if (!cfg[field]) result.errors.push(`Harus punya ${field}.`);
  });
  ['codeTypeInterpretations', 'redFlags', 'reviewRecommendations', 'retestRecommendations'].forEach((field) => {
    if (!cfg[field]) result.warnings.push(`Interpretasi spesialis belum lengkap: ${field} belum tersedia.`);
  });
  result.valid = result.errors.length === 0;
  return result;
};

export const validateCodeTypeConfig = (config: unknown): ValidationResult => {
  const result = emptyResult();
  const entries = Array.isArray(config) ? config : Object.values((config as Record<string, unknown>) ?? {});
  if (!entries.length) result.errors.push('codeTypeConfig harus berisi minimal satu code type.');
  entries.forEach((entry, index) => {
    const row = entry as Record<string, unknown>;
    ['code', 'title', 'interpretation', 'cautionNotes', 'recommendation'].forEach((field) => {
      if (!row[field]) result.errors.push(`Code type baris ${index + 1} harus punya ${field}.`);
    });
  });
  result.valid = result.errors.length === 0;
  return result;
};

export const clinicalInterpretationReady = (args: { questions: Question[]; scoringConfig: ScoringConfig | null; normTable: unknown; interpretationConfig: unknown }) => {
  const scoring = validateScoringConfigAdmin(args.scoringConfig, args.questions);
  const norms = validateNormTable(args.normTable, args.scoringConfig);
  const interpretations = validateInterpretationConfig(args.interpretationConfig);
  const groups = new Set((args.scoringConfig?.scales ?? []).map(scaleGroup));
  const errors = [
    ...(args.questions.length === 567 ? [] : ['Bank soal 567 item belum tersedia.']),
    ...scoring.errors,
    ...norms.errors,
    ...interpretations.errors,
    ...(isDemoLikeConfig(args.scoringConfig) || isDemoLikeConfig(args.interpretationConfig) ? ['Konfigurasi perlu diverifikasi.'] : []),
    ...(!groups.has('validity') || !groups.has('clinical') ? ['Minimal skala validity dan clinical belum tersedia.'] : []),
  ];
  return { ready: errors.length === 0, errors };
};
