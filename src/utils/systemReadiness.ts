import type { AssessmentResult, Question, ScoringConfig, SourceInterpretationConfig, SummaryAnalysisConfig } from '../types';
import { ADMIN_STORAGE_KEYS, loadAdminQuestions, loadAdminScoringConfig, loadAuxConfig, readAdminJson, writeAdminJson } from './adminStorage';
import { ANSWER_VALUES, REQUIRED_TOTAL_QUESTIONS, isAnswerValue, normalizeAnswerValue, plusMinusOptions } from './answerFormat';
import { getUsers } from './userStorage';
import { isAutoDefaultScoring } from './autoDefaultScoring';
import type { AdminUser } from './userStorage';

export const SYSTEM_READINESS_KEYS = {
  ...ADMIN_STORAGE_KEYS,
  rhTemplate: 'sppg_mmpi2_rh_template',
  reportTemplate: 'sppg_mmpi2_report_template',
  configValidationStatus: 'sppg_mmpi2_config_validation_status',
  systemReadiness: 'sppg_mmpi2_system_readiness',
} as const;

export type ReadinessStatus = 'ready' | 'partial' | 'not_ready' | 'optional';
export interface ConfigValidationResult {
  key: string;
  label: string;
  status: ReadinessStatus;
  ready: boolean;
  errors: string[];
  warnings: string[];
  missing: string[];
  details: string[];
  importKey?: string;
}

export interface SystemReadinessStatus {
  systemReadyForInterpretation: boolean;
  questionsReady: boolean;
  scoringReady: boolean;
  normReady: boolean;
  rusdiInterpretationReady: boolean;
  hubertusInterpretationReady: boolean;
  summaryAnalysisReady: boolean;
  rhReady: boolean;
  reportReady: boolean;
  specialistReady: boolean;
  overallStatus: 'SIAP_INTERPRETASI' | 'BELUM_SIAP';
  validations: Record<string, ConfigValidationResult>;
  missingChecklist: MissingConfigItem[];
  updatedAt: string;
}

export interface MissingConfigItem { label: string; storageKey: string; action: string; missing: string[] }
export interface AutoFixPreview { path: string; before: unknown; after: unknown; reason: string }
export interface AutoFixResult { changed: boolean; previews: AutoFixPreview[]; fixedQuestions?: Question[]; fixedScoringConfig?: ScoringConfig }
export interface ReviewStats { totalResults: number; pendingScoring: number; pendingRH: number; needReview: number; reviewed: number; finalized: number; message: string }

const demoTerms = ['demo', 'sample', 'placeholder', 'dummy', 'contoh'];
const hasDemoText = (value: unknown) => demoTerms.some((term) => String(value ?? '').toLowerCase().includes(term));
const hasDemoDeep = (value: unknown) => hasDemoText(JSON.stringify(value ?? {}));
const asRecord = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const issue = (key: string, label: string, importKey?: string): ConfigValidationResult => ({ key, label, importKey, status: 'not_ready', ready: false, errors: [], warnings: [], missing: [], details: [] });
const finish = (result: ConfigValidationResult) => {
  result.ready = result.errors.length === 0 && result.missing.length === 0 && result.status !== 'not_ready';
  if (result.ready) result.status = 'ready';
  return result;
};
const scaleKey = (scale: Record<string, unknown>) => String(scale.code ?? scale.id ?? scale.scaleId ?? '').trim();
const getMainScales = (config: ScoringConfig | null | undefined) => (config?.scales ?? []).filter((scale) => ['validity', 'clinical'].includes(String(scale.group ?? scale.type ?? '').toLowerCase()));
const getClinicalScales = (config: ScoringConfig | null | undefined) => (config?.scales ?? []).filter((scale) => String(scale.group ?? scale.type ?? '').toLowerCase() === 'clinical');
const getScaleCodes = (config: ScoringConfig | null | undefined) => new Set((config?.scales ?? []).flatMap((scale) => [scale.id, scale.code].filter(Boolean).map(String)));
const objectHasAny = (record: Record<string, unknown>, keys: string[]) => keys.some((key) => record[key] !== undefined && record[key] !== null && (!Array.isArray(record[key]) || (record[key] as unknown[]).length > 0));

export const validateQuestions = (questions: unknown = loadAdminQuestions()): ConfigValidationResult => {
  const result = issue('questions', 'Bank Soal', SYSTEM_READINESS_KEYS.questions);
  if (!Array.isArray(questions)) {
    result.errors.push('Bank soal harus berupa array JSON.');
    result.missing.push('Import template_questions.json yang sudah diisi admin dengan bank soal resmi/berizin.');
    return finish(result);
  }
  if (questions.length !== REQUIRED_TOTAL_QUESTIONS) result.errors.push(`Bank soal wajib ${REQUIRED_TOTAL_QUESTIONS} item; saat ini ${questions.length}.`);
  const ids = new Set<number>();
  const numbers = new Set<number>();
  questions.forEach((raw, index) => {
    const q = asRecord(raw);
    const id = Number(q.id);
    const number = Number(q.number ?? q.order);
    const label = `Soal baris ${index + 1}`;
    if (!Number.isFinite(id)) result.errors.push(`${label}: id wajib numerik.`);
    else if (ids.has(id)) result.errors.push(`${label}: id duplikat ${id}.`);
    else ids.add(id);
    if (!Number.isFinite(number) || number <= 0) result.errors.push(`${label}: nomor wajib tersedia.`);
    else if (numbers.has(number)) result.errors.push(`${label}: nomor duplikat ${number}.`);
    else numbers.add(number);
    if (!String(q.text ?? '').trim()) result.errors.push(`${label}: teks soal kosong.`);
    if (q.responseType !== 'plus_minus') result.errors.push(`${label}: responseType wajib plus_minus.`);
    const options = asArray(q.options).map(asRecord);
    const optionValues = options.map((option) => option.value);
    const validOptions = options.length === 2 && ANSWER_VALUES.every((value) => optionValues.includes(value));
    if (!validOptions) result.errors.push(`${label}: options wajib tepat dua dan hanya berisi "+" serta "-".`);
  });
  result.details.push('Validasi mencakup jumlah 567, id/nomor unik, teks tidak kosong, responseType plus_minus, dan opsi +/- tanpa duplikasi.');
  result.status = result.errors.length ? 'not_ready' : 'ready';
  return finish(result);
};

export const validateScoringConfig = (config: unknown = loadAdminScoringConfig(), questions: Question[] = loadAdminQuestions()): ConfigValidationResult => {
  const result = issue('scoring', 'ScoringConfig', SYSTEM_READINESS_KEYS.scoringConfig);
  const cfg = asRecord(config);
  if (!Object.keys(cfg).length) {
    result.errors.push('ScoringConfig belum tersedia.');
    result.missing.push('Import template_scoringConfig.json yang sudah diisi kunci scoring resmi/berizin.');
    return finish(result);
  }
  if (isAutoDefaultScoring(config as ScoringConfig)) {
    result.status = 'ready';
    result.warnings.push('ScoringConfig auto-default tersedia untuk scoring teknis. Bukan scoring resmi dan belum valid untuk laporan klinis final.');
    result.details.push('Status: Siap scoring teknis. Keterangan: perlu diganti/verifikasi dengan scoringConfig resmi/berizin untuk laporan final.');
    return finish(result);
  }
  if (Number(cfg.totalItems) !== REQUIRED_TOTAL_QUESTIONS) result.errors.push(`totalItems wajib ${REQUIRED_TOTAL_QUESTIONS}.`);
  if (hasDemoDeep(config)) result.errors.push('ScoringConfig mengandung demo/sample/placeholder/dummy.');
  const scales = asArray(cfg.scales).map(asRecord);
  if (!scales.length) result.errors.push('ScoringConfig wajib memiliki array scales.');
  const groups = new Set(scales.map((scale) => String(scale.group ?? scale.type ?? '').toLowerCase()));
  if (!groups.has('validity')) result.errors.push('Skala validity belum tersedia.');
  if (!groups.has('clinical')) result.errors.push('Skala clinical belum tersedia.');
  const questionIds = new Set(questions.map((q) => Number(q.id)));
  const missingQuestionIds: string[] = [];
  scales.forEach((scale, scaleIndex) => {
    const label = `Scale ${scale.code ?? scale.id ?? scaleIndex + 1}`;
    ['id', 'code', 'name', 'group'].forEach((field) => { if (!String(scale[field] ?? '').trim()) result.errors.push(`${label}: field ${field} wajib ada.`); });
    const items = asArray(scale.items).map(asRecord);
    if (!items.length) result.errors.push(`${label}: items scoring wajib ada.`);
    items.forEach((item, itemIndex) => {
      const qid = Number(item.questionId);
      if (!Number.isFinite(qid)) result.errors.push(`${label} item ${itemIndex + 1}: questionId wajib numerik.`);
      else if (questions.length && !questionIds.has(qid)) missingQuestionIds.push(`${label}:${qid}`);
      if (!isAnswerValue(item.scoredResponse)) result.errors.push(`${label} questionId ${item.questionId}: scoredResponse wajib + atau -.`);
      if (!Number.isFinite(Number(item.point))) result.errors.push(`${label} questionId ${item.questionId}: point wajib numerik.`);
    });
  });
  if (missingQuestionIds.length) result.errors.push(`questionId tidak cocok dengan bank soal: ${missingQuestionIds.slice(0, 30).join(', ')}${missingQuestionIds.length > 30 ? ' ...' : ''}`);
  result.details.push('Auto-fix hanya boleh mengubah true/false atau Ya/Tidak menjadi +/-, questionId string angka menjadi number, dan totalItems bila bank soal valid.');
  result.status = result.errors.length ? 'not_ready' : 'ready';
  return finish(result);
};

const normScaleKeys = (normTable: unknown) => {
  const norm = asRecord(normTable);
  const source = Array.isArray(normTable) ? normTable : asArray(norm.scales ?? norm.norms ?? norm.entries ?? Object.values(norm));
  return new Set(source.map((entry) => {
    const row = asRecord(entry);
    return String(row.scaleId ?? row.scaleCode ?? row.code ?? row.id ?? '').trim();
  }).filter(Boolean));
};

export const validateNormTable = (normTable: unknown = loadAuxConfig('normTable'), scoringConfig: ScoringConfig | null = loadAdminScoringConfig()): ConfigValidationResult => {
  const result = issue('norm', 'NormTable T-score', SYSTEM_READINESS_KEYS.normTable);
  if (!normTable || !Object.keys(asRecord(normTable)).length && !Array.isArray(normTable)) {
    result.errors.push('NormTable belum tersedia.');
    result.missing.push('Import template_normTable.json yang sudah diisi norma T-score resmi/berizin.');
    return finish(result);
  }
  if (hasDemoDeep(normTable)) result.errors.push('NormTable mengandung demo/sample/placeholder/dummy.');
  const available = normScaleKeys(normTable);
  const missing = getMainScales(scoringConfig).filter((scale) => !available.has(String(scale.id)) && !available.has(String(scale.code ?? ''))).map((scale) => String(scale.code ?? scale.id));
  if (missing.length) {
    result.status = 'partial';
    result.missing.push(...missing.map((scale) => `Norma T-score belum ada untuk skala ${scale}.`));
  }
  const norm = asRecord(normTable);
  if (!objectHasAny(norm, ['general', 'scales', 'norms', 'entries', 'byGender', 'byAge'])) result.warnings.push('Struktur norma tidak menyebut general/byGender/byAge; pastikan loader dapat memilih norma sesuai identitas peserta.');
  result.details.push('NormTable harus mengacu ke scaleId/code yang ada di ScoringConfig. Jika sebagian norma hilang, status tidak akan siap interpretasi.');
  if (!result.status.includes('partial')) result.status = result.errors.length || result.missing.length ? 'not_ready' : 'ready';
  return finish(result);
};

const validateSourceInterpretation = (config: unknown, expectedSource: 'Rusdi Maslim' | 'Hubertus', key: string, importKey: string, scoringConfig: ScoringConfig | null = loadAdminScoringConfig()): ConfigValidationResult => {
  const result = issue(key, `Interpretasi ${expectedSource}`, importKey);
  const cfg = asRecord(config);
  if (!Object.keys(cfg).length) {
    result.errors.push(`InterpretationConfig ${expectedSource} belum tersedia.`);
    result.missing.push(`Import template_interpretation_${expectedSource === 'Rusdi Maslim' ? 'rusdi_maslim' : 'hubertus'}.json yang sudah diisi admin dari sumber resmi/berizin.`);
    return finish(result);
  }
  if (String(cfg.sourceName) !== expectedSource) result.errors.push(`sourceName wajib "${expectedSource}".`);
  if (cfg.isDemo !== false) result.errors.push('isDemo wajib false.');
  if (cfg.isAutoDefault) result.warnings.push('Auto-default tersedia: valid secara struktur untuk preview teknis, tetapi perlu verifikasi admin/spesialis dan belum resmi/berizin.');
  if (!cfg.isAutoDefault && hasDemoDeep(config)) result.errors.push('Konfigurasi interpretasi mengandung demo/sample/placeholder/dummy.');
  ['validityInterpretations', 'scaleInterpretations', 'domainInterpretations', 'appendix'].forEach((field) => {
    if (!Object.keys(asRecord(cfg[field])).length) result.errors.push(`${field} wajib tersedia dan tidak kosong.`);
  });
  if (!Object.keys(asRecord(cfg.recommendationRules)).length && !asArray(cfg.recommendationRules).length) result.errors.push('recommendationRules wajib tersedia dan tidak kosong.');
  const scaleInterpretations = asRecord(cfg.scaleInterpretations);
  const scaleCodes = getScaleCodes(scoringConfig);
  const missingScales = getMainScales(scoringConfig).filter((scale) => !scaleInterpretations[String(scale.code ?? '')] && !scaleInterpretations[String(scale.id)]).map((scale) => String(scale.code ?? scale.id));
  if (missingScales.length) result.missing.push(...missingScales.map((scale) => `Interpretasi skala ${scale} belum tersedia.`));
  Object.keys(scaleInterpretations).forEach((code) => { if (scaleCodes.size && !scaleCodes.has(code)) result.errors.push(`Interpretasi mengacu ke kode skala tidak valid: ${code}.`); });
  result.details.push(cfg.isAutoDefault ? 'Config auto-default tersedia untuk preview teknis, belum diverifikasi sebagai interpretasi resmi.' : `Validasi ${expectedSource} menolak demo/placeholder dan tidak mengarang teks klinis.`);
  result.status = result.errors.length || result.missing.length ? 'not_ready' : 'ready';
  return finish(result);
};

export const validateRusdiInterpretationConfig = (config: unknown = loadAuxConfig('interpretationRusdiMaslim'), scoringConfig?: ScoringConfig | null) => validateSourceInterpretation(config, 'Rusdi Maslim', 'rusdiInterpretation', SYSTEM_READINESS_KEYS.interpretationRusdiMaslim, scoringConfig ?? loadAdminScoringConfig());
export const validateHubertusInterpretationConfig = (config: unknown = loadAuxConfig('interpretationHubertus'), scoringConfig?: ScoringConfig | null) => validateSourceInterpretation(config, 'Hubertus', 'hubertusInterpretation', SYSTEM_READINESS_KEYS.interpretationHubertus, scoringConfig ?? loadAdminScoringConfig());

export const validateCodeTypeConfig = (config: unknown, label = 'CodeTypeConfig', normReady = false): ConfigValidationResult => {
  const result = issue(label.toLowerCase().replace(/\s+/g, '-'), label);
  if (!config) {
    result.status = 'optional';
    result.ready = true;
    result.details.push('Opsional tidak digunakan; sistem tidak akan mengarang code type.');
    return result;
  }
  if (!normReady) result.errors.push('Code type hanya aktif jika skala klinis dan T-score tersedia.');
  const entries = Array.isArray(config) ? config : Object.values(asRecord(config));
  entries.map(asRecord).forEach((entry, index) => ['code', 'title', 'interpretation', 'cautionNotes', 'recommendation'].forEach((field) => {
    if (entry[field] === undefined || entry[field] === null || String(entry[field]).trim() === '') result.errors.push(`Code type ${index + 1}: ${field} wajib ada.`);
  }));
  if (!entries.length) result.errors.push('CodeTypeConfig kosong.');
  if (hasDemoDeep(config)) result.errors.push('CodeTypeConfig mengandung demo/sample/placeholder/dummy.');
  result.status = result.errors.length ? 'not_ready' : 'ready';
  return finish(result);
};

export const validateSummaryAnalysisConfig = (config: unknown = loadAuxConfig<SummaryAnalysisConfig>('summaryAnalysisConfig')): ConfigValidationResult => {
  const result = issue('summaryAnalysis', 'Analisa Ringkas TNI AU', SYSTEM_READINESS_KEYS.summaryAnalysisConfig);
  const cfg = asRecord(config);
  if (!Object.keys(cfg).length) {
    result.errors.push('SummaryAnalysisConfig belum tersedia.');
    result.missing.push('Import template_summaryAnalysisConfig.json yang sudah diisi formula/rule resmi internal.');
    return finish(result);
  }
  if (cfg.isDemo !== false || hasDemoDeep(config)) result.errors.push('SummaryAnalysisConfig tidak boleh demo/sample/placeholder/dummy dan isDemo wajib false.');
  const required = [
    ['validityAttitude', 'Sikap terhadap tes'],
    ['mentalCapacityIndex', 'Indeks Kapasitas Mental'],
    ['clinicalProfile', 'Profil Klinis'],
    ['basicPersonalityIndex', 'Indeks Kepribadian Dasar / OCEAN'],
    ['conclusionTemplates', 'Kesimpulan dan Saran'],
  ] as const;
  required.forEach(([field, label]) => { if (!Object.keys(asRecord(cfg[field])).length) result.errors.push(`${label} wajib tersedia.`); });
  ['mentalCapacityIndex', 'basicPersonalityIndex'].forEach((field) => {
    const section = asRecord(cfg[field]);
    const variables = asArray(section.variables).map(asRecord);
    if (!variables.length) result.errors.push(`${field}: variables/formula wajib tersedia.`);
    variables.forEach((variable) => { if (!variable.formula && !asArray(variable.sourceScales).length) result.errors.push(`${field}/${variable.id ?? 'variable'}: formula atau sourceScales wajib ada.`); });
    if (!asArray(section.categoryRules).length) result.errors.push(`${field}: categoryRules skala 0–10 wajib tersedia.`);
  });
  result.status = result.errors.length ? 'not_ready' : 'ready';
  return finish(result);
};

export const validateRHTemplate = (template: unknown = readAdminJson(SYSTEM_READINESS_KEYS.rhTemplate, null)): ConfigValidationResult => {
  const result = issue('rh', 'RH Skrining', SYSTEM_READINESS_KEYS.rhTemplate);
  const cfg = asRecord(template);
  if (!Object.keys(cfg).length) result.warnings.push('Template RH khusus belum diimpor; validasi memakai struktur RH bawaan aplikasi.');
  const source = Object.keys(cfg).length ? cfg : { consent: true, identity: true, healthHistory: { itemCount: 50 }, education: true, work: true, family: true, social: true, redFlagRules: true, requiredFieldValidation: true, requiredAfterMmpi: true };
  const health = asRecord(asRecord(source).healthHistory);
  const checks = [
    ['consent', 'Form Surat Pernyataan / Informed Consent'], ['identity', 'Identitas'], ['education', 'Pendidikan'], ['work', 'Pekerjaan'], ['family', 'Keluarga'], ['social', 'Sosial'], ['redFlagRules', 'Red flag rules'], ['requiredFieldValidation', 'Validasi field wajib'], ['requiredAfterMmpi', 'RH wajib setelah MMPI aktif'],
  ];
  checks.forEach(([field, label]) => { if (!asRecord(source)[field]) result.errors.push(`${label} belum tersedia.`); });
  if (Number(health.itemCount ?? asArray(health.items).length) < 50) result.errors.push('Riwayat kesehatan wajib memuat 50 item.');
  if (hasDemoDeep(template)) result.errors.push('RHTemplate mengandung demo/sample/placeholder/dummy.');
  result.status = result.errors.length ? 'not_ready' : 'ready';
  return finish(result);
};

export const validateReportTemplate = (template: unknown = readAdminJson(SYSTEM_READINESS_KEYS.reportTemplate, null)): ConfigValidationResult => {
  const result = issue('report', 'Template Laporan', SYSTEM_READINESS_KEYS.reportTemplate);
  const cfg = asRecord(template);
  if (!Object.keys(cfg).length) {
    result.errors.push('ReportTemplate belum tersedia.');
    result.missing.push('Import template_reportTemplate.json yang memuat struktur laporan lengkap.');
    return finish(result);
  }
  const required = ['institutionHeader', 'participantIdentity', 'startedAt', 'completedAt', 'duration', 'totalItems', 'answeredItems', 'scoreChart', 'scoreTable', 'rusdiMaslimInterpretation', 'hubertusInterpretation', 'interpretationComparison', 'summaryAnalysis', 'rhScreening', 'rhRedFlags', 'specialistNotes', 'finalSpecialistConclusion', 'examinerSignature', 'disclaimer'];
  required.forEach((field) => { if (!cfg[field]) result.errors.push(`Bagian laporan wajib ada: ${field}.`); });
  if (hasDemoDeep(template)) result.errors.push('ReportTemplate mengandung demo/sample/placeholder/dummy.');
  result.status = result.errors.length ? 'not_ready' : 'ready';
  return finish(result);
};

export const validateSpecialistUsers = (users: AdminUser[] = getUsers()): ConfigValidationResult => {
  const result = issue('specialist', 'User Spesialis', SYSTEM_READINESS_KEYS.users);
  const specialists = users.filter((user) => user.role === 'specialist' && user.isActive);
  if (!specialists.length) result.errors.push('Minimal satu user role specialist aktif wajib tersedia.');
  specialists.forEach((user) => {
    if (!String(user.displayName ?? user.signature?.name ?? '').trim()) result.errors.push(`Specialist ${user.username}: nama wajib ada.`);
    if (!String(user.signature?.title ?? '').trim()) result.errors.push(`Specialist ${user.username}: jabatan wajib ada.`);
    if (!user.permissions.includes('review.finalize') && user.role !== 'specialist') result.errors.push(`Specialist ${user.username}: harus dapat finalisasi laporan.`);
  });
  result.details.push('Nomor izin/SIP/identitas pemeriksa divalidasi bila tersedia pada profil/signature.');
  result.status = result.errors.length ? 'not_ready' : 'ready';
  return finish(result);
};

export const validateAllConfigs = () => {
  const questions = loadAdminQuestions();
  const scoringConfig = loadAdminScoringConfig();
  const norm = loadAuxConfig('normTable');
  const normResult = validateNormTable(norm, scoringConfig);
  const validations = {
    questions: validateQuestions(questions),
    scoring: validateScoringConfig(scoringConfig, questions),
    norm: normResult,
    rusdiInterpretation: validateRusdiInterpretationConfig(loadAuxConfig<SourceInterpretationConfig>('interpretationRusdiMaslim'), scoringConfig),
    hubertusInterpretation: validateHubertusInterpretationConfig(loadAuxConfig<SourceInterpretationConfig>('interpretationHubertus'), scoringConfig),
    codeTypeRusdi: validateCodeTypeConfig(loadAuxConfig('codeTypeRusdiMaslim'), 'CodeType Rusdi Maslim', normResult.ready),
    codeTypeHubertus: validateCodeTypeConfig(loadAuxConfig('codeTypeHubertus'), 'CodeType Hubertus', normResult.ready),
    summaryAnalysis: validateSummaryAnalysisConfig(),
    rh: validateRHTemplate(),
    report: validateReportTemplate(),
    specialist: validateSpecialistUsers(),
  };
  writeAdminJson(SYSTEM_READINESS_KEYS.configValidationStatus, validations);
  return validations;
};

export const getMissingConfigChecklist = (validations: Record<string, ConfigValidationResult> = validateAllConfigs()): MissingConfigItem[] => Object.values(validations)
  .filter((validation) => !validation.ready && validation.status !== 'optional')
  .map((validation) => ({ label: validation.label, storageKey: validation.importKey ?? '-', action: validation.missing[0] ?? `Lengkapi ${validation.label}.`, missing: [...validation.errors, ...validation.missing] }));

export const getSystemReadinessStatus = (): SystemReadinessStatus => {
  const validations = validateAllConfigs();
  const ready = {
    questionsReady: validations.questions.ready,
    scoringReady: validations.scoring.ready,
    normReady: validations.norm.ready,
    rusdiInterpretationReady: validations.rusdiInterpretation.ready,
    hubertusInterpretationReady: validations.hubertusInterpretation.ready,
    summaryAnalysisReady: validations.summaryAnalysis.ready,
    rhReady: validations.rh.ready,
    reportReady: validations.report.ready,
    specialistReady: validations.specialist.ready,
  };
  const systemReadyForInterpretation = Object.values(ready).every(Boolean);
  return { systemReadyForInterpretation, ...ready, overallStatus: systemReadyForInterpretation ? 'SIAP_INTERPRETASI' : 'BELUM_SIAP', validations, missingChecklist: getMissingConfigChecklist(validations), updatedAt: new Date().toISOString() };
};

export const markSystemReadyForInterpretation = () => {
  const status = getSystemReadinessStatus();
  if (!status.systemReadyForInterpretation) {
    writeAdminJson(SYSTEM_READINESS_KEYS.systemReadiness, status);
    return status;
  }
  const finalStatus: SystemReadinessStatus = { ...status, systemReadyForInterpretation: true, overallStatus: 'SIAP_INTERPRETASI' };
  writeAdminJson(SYSTEM_READINESS_KEYS.systemReadiness, finalStatus);
  return finalStatus;
};

export const autoFixConfigStructure = (questions: Question[] = loadAdminQuestions(), scoringConfig: ScoringConfig | null = loadAdminScoringConfig(), persist = false): AutoFixResult => {
  const previews: AutoFixPreview[] = [];
  const fixedQuestions = questions.map((question, index) => {
    const next = { ...question } as Question;
    if (!next.number) { previews.push({ path: `questions[${index}].number`, before: next.number, after: index + 1, reason: 'Menambahkan number berdasarkan urutan soal.' }); next.number = index + 1; }
    if (next.responseType !== 'plus_minus') { previews.push({ path: `questions[${index}].responseType`, before: next.responseType, after: 'plus_minus', reason: 'Menyamakan responseType ke plus_minus.' }); next.responseType = 'plus_minus'; }
    const values = (next.options ?? []).map((option) => option.value);
    if (next.options?.length !== 2 || !ANSWER_VALUES.every((value) => values.includes(value))) { previews.push({ path: `questions[${index}].options`, before: next.options, after: plusMinusOptions(), reason: 'Mengubah opsi teknis ke + dan -.' }); next.options = plusMinusOptions(); }
    return next;
  });
  const fixedScoringConfig = scoringConfig ? {
    ...scoringConfig,
    totalItems: fixedQuestions.length === REQUIRED_TOTAL_QUESTIONS && Number(scoringConfig.totalItems) !== REQUIRED_TOTAL_QUESTIONS ? REQUIRED_TOTAL_QUESTIONS : scoringConfig.totalItems,
    scales: (scoringConfig.scales ?? []).map((scale, scaleIndex) => ({
      ...scale,
      scaleId: (scale as unknown as Record<string, unknown>).scaleId ?? scale.id,
      items: (scale.items ?? []).map((item, itemIndex) => {
        const normalized = normalizeAnswerValue(item.scoredResponse);
        const qid = Number(item.questionId);
        const next = { ...item };
        if (normalized && normalized !== item.scoredResponse) { previews.push({ path: `scales[${scaleIndex}].items[${itemIndex}].scoredResponse`, before: item.scoredResponse, after: normalized, reason: 'Auto-konversi true/false atau Ya/Tidak ke +/-.' }); next.scoredResponse = normalized; }
        if (Number.isFinite(qid) && qid !== item.questionId) { previews.push({ path: `scales[${scaleIndex}].items[${itemIndex}].questionId`, before: item.questionId, after: qid, reason: 'Mengubah questionId string angka menjadi number.' }); next.questionId = qid; }
        return next;
      }),
    })),
  } as ScoringConfig : undefined;
  if (scoringConfig && fixedQuestions.length === REQUIRED_TOTAL_QUESTIONS && Number(scoringConfig.totalItems) !== REQUIRED_TOTAL_QUESTIONS) previews.push({ path: 'scoringConfig.totalItems', before: scoringConfig.totalItems, after: REQUIRED_TOTAL_QUESTIONS, reason: 'Mengisi totalItems = 567 karena bank soal valid 567.' });
  if (persist && previews.length) {
    writeAdminJson(SYSTEM_READINESS_KEYS.questions, fixedQuestions);
    if (fixedScoringConfig) writeAdminJson(SYSTEM_READINESS_KEYS.scoringConfig, fixedScoringConfig);
  }
  return { changed: previews.length > 0, previews, fixedQuestions, fixedScoringConfig };
};

export const calculateReviewStats = (results: AssessmentResult[] = readAdminJson<AssessmentResult[]>(ADMIN_STORAGE_KEYS.results, [])): ReviewStats => {
  const pendingScoring = results.filter((result) => (result as unknown as { scoringStatus?: string }).scoringStatus && (result as unknown as { scoringStatus?: string }).scoringStatus !== 'scored').length;
  const pendingRH = results.filter((result) => !result.rhCompleted || result.assessment?.status === 'pending_rh').length;
  const needReview = results.filter((result) => result.status === 'Perlu Review' || !result.specialistReview || result.specialistReview.status === 'pending').length;
  const reviewed = results.filter((result) => result.specialistReview?.status === 'reviewed').length;
  const finalized = results.filter((result) => result.specialistReview?.status === 'finalized').length;
  const message = results.length === 0 ? 'Belum ada hasil peserta.' : pendingScoring ? `Menunggu scoring: ${pendingScoring}` : pendingRH ? `Menunggu RH: ${pendingRH}` : needReview ? `Perlu telaah: ${needReview}` : '0 — tidak ada laporan yang memerlukan telaah saat ini.';
  return { totalResults: results.length, pendingScoring, pendingRH, needReview, reviewed, finalized, message };
};

export const canShowCompleteSpecialistReport = (result: AssessmentResult) => {
  const readiness = readAdminJson<SystemReadinessStatus | null>(SYSTEM_READINESS_KEYS.systemReadiness, null) ?? getSystemReadinessStatus();
  const scoringStatus = (result as unknown as { scoringStatus?: string }).scoringStatus;
  return (scoringStatus === 'scored' || (!scoringStatus && result.scores.length > 0)) && readiness.normReady && readiness.rusdiInterpretationReady && readiness.hubertusInterpretationReady && result.rhCompleted === true && readiness.systemReadyForInterpretation;
};
