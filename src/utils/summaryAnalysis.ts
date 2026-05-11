import type { AssessmentResult, RHForm, RHSummary, ScoreRow, ScoringConfig, SpecialistReview, SummaryAnalysisConfig, SummaryAnalysisResult, SummaryAnalysisValidationResult, SummaryAnalysisVariableConfig, SummaryAnalysisVariableResult, ValidityStatus } from '../types';
import { downloadFile } from './export';
import { STORAGE_KEYS } from './storage';

export const SUMMARY_ANALYSIS_CONFIG_KEY = 'sppg_mmpi2_summary_analysis_config';
export const MISSING_VALUE_LABEL = 'Belum tersedia / perlu konfigurasi admin';

const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const formulaPlaceholder = (formula?: string) => !formula || formula.trim() === '' || formula.trim() === 'admin_config_formula';
const scoreKey = (score: ScoreRow) => [score.scaleId, score.code, score.scaleName].filter(Boolean).map((item) => String(item).toLowerCase());
const hasScore = (scores: ScoreRow[], source: string) => scores.some((score) => scoreKey(score).includes(source.toLowerCase()));
const findScore = (scores: ScoreRow[], source: string) => scores.find((score) => scoreKey(score).includes(source.toLowerCase()));
const scaleValue = (score?: ScoreRow) => score?.tScore ?? score?.rawScore;

export const loadSummaryAnalysisConfig = (): SummaryAnalysisConfig | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SUMMARY_ANALYSIS_CONFIG_KEY);
    return raw ? JSON.parse(raw) as SummaryAnalysisConfig : null;
  } catch {
    return null;
  }
};

export const saveSummaryAnalysisConfig = (config: SummaryAnalysisConfig) => localStorage.setItem(SUMMARY_ANALYSIS_CONFIG_KEY, JSON.stringify(config));
export const clearSummaryAnalysisConfig = () => localStorage.removeItem(SUMMARY_ANALYSIS_CONFIG_KEY);

const validateVariables = (name: string, variables: SummaryAnalysisVariableConfig[] | undefined, scoresOrConfig?: ScoringConfig | ScoreRow[] | null) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!variables?.length) {
    warnings.push(`${name}: daftar variabel belum tersedia.`);
    return { errors, warnings };
  }
  const scaleIds = Array.isArray(scoresOrConfig) ? undefined : new Set((scoresOrConfig?.scales ?? []).flatMap((scale) => [scale.id, scale.code].filter(Boolean).map(String)));
  variables.forEach((variable) => {
    if (!variable.id || !variable.label) errors.push(`${name}: variabel wajib memiliki id dan label.`);
    if (formulaPlaceholder(variable.formula)) warnings.push(`${name}/${variable.label}: formula belum tersedia; nilai akan ditampilkan sebagai belum tersedia.`);
    if (!variable.sourceScales?.length) warnings.push(`${name}/${variable.label}: sourceScales kosong; nilai tidak akan dihitung.`);
    variable.sourceScales?.forEach((source) => { if (scaleIds && !scaleIds.has(source)) warnings.push(`${name}/${variable.label}: source scale "${source}" tidak ditemukan pada scoringConfig.`); });
  });
  return { errors, warnings };
};

export const validateSummaryAnalysisConfig = (config: SummaryAnalysisConfig | null, scoringConfig?: ScoringConfig | null): SummaryAnalysisValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!config) return { valid: false, errors: ['Konfigurasi Analisa Ringkas belum tersedia.'], warnings: [] };
  if (!config.configName) errors.push('configName wajib diisi.');
  if (!config.version) warnings.push('version belum diisi.');
  if (config.isDemo) warnings.push('Analisa Ringkas masih demo dan tidak valid untuk laporan final.');
  if (!config.validityAttitude?.scoreRules?.length) warnings.push('Validity attitude rules belum lengkap.');
  if (!config.validityAttitude?.sourceScales?.length) warnings.push('Validity attitude sourceScales kosong.');
  const mental = validateVariables('Indeks Kapasitas Mental', config.mentalCapacityIndex?.variables, scoringConfig);
  const personality = validateVariables('Indeks Kepribadian Dasar', config.basicPersonalityIndex?.variables, scoringConfig);
  errors.push(...mental.errors, ...personality.errors);
  warnings.push(...mental.warnings, ...personality.warnings);
  if (!config.mentalCapacityIndex?.categoryRules?.length) warnings.push('Kategori Indeks Kapasitas Mental belum tersedia.');
  if (!config.basicPersonalityIndex?.categoryRules?.length) warnings.push('Kategori Indeks Kepribadian Dasar/OCEAN belum tersedia.');
  if (!config.clinicalProfile?.sourceScales?.length) warnings.push('Clinical profile sourceScales kosong.');
  if (!config.clinicalProfile?.narrativeRules?.length) warnings.push('Clinical profile narrativeRules belum tersedia.');
  if (!config.conclusionTemplates) warnings.push('Conclusion templates belum tersedia.');
  return { valid: errors.length === 0, errors, warnings };
};

const evaluateFormula = (formula: string, scores: ScoreRow[], sourceScales: string[]) => {
  const context: Record<string, number> = {};
  for (const source of sourceScales) {
    const score = findScore(scores, source);
    const value = scaleValue(score);
    if (!Number.isFinite(value)) return null;
    context[source] = Number(value);
  }
  if (!/^[\w\s.+\-*/()%<>=!&|?:,]+$/.test(formula)) return null;
  const names = Object.keys(context);
  try {
    const fn = new Function(...names, `"use strict"; return (${formula});`);
    const value = fn(...names.map((name) => context[name]));
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.max(0, Math.min(2, Math.round(numeric))) : null;
  } catch {
    return null;
  }
};

const categoryFor = (value: number | null, rules?: Array<{ min: number; max: number; label: string }>) => value === null ? MISSING_VALUE_LABEL : rules?.find((rule) => value >= rule.min && value <= rule.max)?.label ?? MISSING_VALUE_LABEL;

export const calculateTestAttitude = (validityStatus: ValidityStatus | undefined, scores: ScoreRow[], config: SummaryAnalysisConfig): SummaryAnalysisResult['testAttitude'] => {
  const warnings: string[] = [];
  const sources = config.validityAttitude?.sourceScales ?? [];
  if (!sources.length) warnings.push('sourceScales validitas belum dikonfigurasi.');
  sources.forEach((source) => { if (!hasScore(scores, source)) warnings.push(`Skala validitas ${source} tidak ditemukan.`); });
  const score = validityStatus?.status === 'invalid' ? 0 : validityStatus?.status === 'caution' ? 1 : validityStatus?.status === 'valid' ? 2 : null;
  const rule = config.validityAttitude?.scoreRules?.find((item) => item.score === score);
  const narrative = score !== null ? (config.validityAttitude?.narrativeTemplates?.[String(score)] ?? rule?.description ?? '') : '';
  return { score, label: rule?.label ?? validityStatus?.label ?? MISSING_VALUE_LABEL, narrative: narrative || MISSING_VALUE_LABEL, warnings };
};

const calculateIndex = (scores: ScoreRow[], variables: SummaryAnalysisVariableConfig[] = [], rules?: Array<{ min: number; max: number; label: string }>) => {
  const warnings: string[] = [];
  const variableResults: SummaryAnalysisVariableResult[] = variables.map((variable) => {
    let warning = '';
    if (formulaPlaceholder(variable.formula)) warning = 'Formula belum tersedia.';
    else if (!variable.sourceScales?.length) warning = 'sourceScales belum tersedia.';
    else if (variable.sourceScales.some((source) => !hasScore(scores, source))) warning = `sourceScales tidak ditemukan: ${variable.sourceScales.filter((source) => !hasScore(scores, source)).join(', ')}.`;
    const value = warning ? null : evaluateFormula(variable.formula!, scores, variable.sourceScales!);
    if (value === null && !warning) warning = 'Formula tidak dapat divalidasi/dihitung.';
    if (warning) warnings.push(`${variable.label}: ${warning}`);
    return { id: variable.id, label: variable.label, englishLabel: variable.englishLabel, value, rangeDescription: variable.rangeDescription ?? MISSING_VALUE_LABEL, category: categoryFor(value, rules), warning };
  });
  const availableValues = variableResults.map((item) => item.value).filter((value): value is number => value !== null);
  const total = availableValues.length === variableResults.length && variableResults.length > 0 ? availableValues.reduce((sum, value) => sum + value, 0) : null;
  return { variables: variableResults, total, category: categoryFor(total, rules), warnings };
};

export const calculateMentalCapacityIndex = (scores: ScoreRow[], config: SummaryAnalysisConfig): SummaryAnalysisResult['mentalCapacityIndex'] => calculateIndex(scores, config.mentalCapacityIndex?.variables, config.mentalCapacityIndex?.categoryRules);

export const calculateBasicPersonalityIndex = (scores: ScoreRow[], config: SummaryAnalysisConfig): SummaryAnalysisResult['basicPersonalityIndex'] => calculateIndex(scores, config.basicPersonalityIndex?.variables, config.basicPersonalityIndex?.categoryRules);

export const generateClinicalProfileSummary = (scores: ScoreRow[], config: SummaryAnalysisConfig): SummaryAnalysisResult['clinicalProfileSummary'] => {
  const warnings: string[] = [];
  if (!config.clinicalProfile?.sourceScales?.length || !config.clinicalProfile.narrativeRules?.length) return { narratives: [], redFlags: [], warnings: ['Profil klinis ringkas belum dapat dibuat karena konfigurasi analisa belum lengkap.'] };
  config.clinicalProfile.sourceScales.forEach((source) => { if (!hasScore(scores, source)) warnings.push(`Skala klinis ${source} tidak ditemukan.`); });
  const narratives = config.clinicalProfile.narrativeRules.filter((rule) => {
    if (rule.formula && rule.sourceScales?.length) return evaluateFormula(rule.formula, scores, rule.sourceScales) !== null;
    if (!rule.sourceScales?.length) return false;
    return rule.sourceScales.some((source) => {
      const value = scaleValue(findScore(scores, source));
      if (!Number.isFinite(value)) return false;
      if (rule.minTScore !== undefined || rule.maxTScore !== undefined) {
        const t = findScore(scores, source)?.tScore;
        return Number.isFinite(t) && t! >= (rule.minTScore ?? -Infinity) && t! <= (rule.maxTScore ?? Infinity);
      }
      return value! >= (rule.minRaw ?? -Infinity) && value! <= (rule.maxRaw ?? Infinity);
    });
  }).map((rule) => rule.text);
  return { narratives, redFlags: narratives.filter((text) => /risiko|red flag|bahaya/i.test(text)), warnings };
};

export const generateSummaryConclusion = (summaryAnalysis: SummaryAnalysisResult, rhSummary?: RHSummary, specialistReview?: SpecialistReview): SummaryAnalysisResult['conclusionAndSuggestion'] => {
  const invalid = summaryAnalysis.testAttitude.score === 0;
  const caution = summaryAnalysis.testAttitude.score === 1 || Boolean(rhSummary?.needsSpecialistReview);
  const prefix = 'Berdasarkan skor validitas, indeks kapasitas mental, indeks kepribadian dasar, dan profil klinis, hasil ini menunjukkan';
  const statusText = invalid ? 'profil belum memadai untuk kesimpulan final dan disarankan review atau retest.' : caution ? 'perlunya interpretasi hati-hati dan konfirmasi melalui wawancara klinis.' : 'data pendukung yang dapat ditelaah lebih lanjut oleh pemeriksa berwenang.';
  const rhText = rhSummary?.needsSpecialistReview ? ' RH Skrining memuat red flags sehingga perlu telaah khusus.' : '';
  const reviewText = specialistReview?.finalConclusion ? ' Catatan spesialis tersedia dan harus diprioritaskan dalam keputusan akhir.' : '';
  return {
    conclusion: `${prefix} ${statusText}${rhText}${reviewText}`,
    suggestion: `${invalid ? 'Review protokol atau retest oleh profesional berwenang. ' : ''}Kesimpulan akhir harus ditetapkan oleh dokter jiwa/psikolog klinis/pemeriksa berwenang.`,
  };
};

export const buildSummaryAnalysis = (result: Pick<AssessmentResult, 'scores' | 'validityStatus' | 'rhSummary' | 'specialistReview'>, config = loadSummaryAnalysisConfig()): SummaryAnalysisResult => {
  if (!config) return { available: false, isDemo: false, message: 'Analisa Ringkas TNI AU belum tersedia. Admin perlu mengimpor konfigurasi analisa.', testAttitude: { score: null, label: MISSING_VALUE_LABEL, narrative: MISSING_VALUE_LABEL }, mentalCapacityIndex: { variables: [], total: null, category: MISSING_VALUE_LABEL }, clinicalProfileSummary: { narratives: [], redFlags: [] }, basicPersonalityIndex: { variables: [], total: null, category: MISSING_VALUE_LABEL }, conclusionAndSuggestion: { conclusion: MISSING_VALUE_LABEL, suggestion: 'Admin perlu mengimpor konfigurasi analisa.' } };
  const validation = validateSummaryAnalysisConfig(config);
  const analysis: SummaryAnalysisResult = {
    available: true,
    isDemo: Boolean(config.isDemo),
    validationWarnings: [...validation.errors, ...validation.warnings],
    testAttitude: calculateTestAttitude(result.validityStatus, result.scores, config),
    mentalCapacityIndex: calculateMentalCapacityIndex(result.scores, config),
    clinicalProfileSummary: generateClinicalProfileSummary(result.scores, config),
    basicPersonalityIndex: calculateBasicPersonalityIndex(result.scores, config),
    conclusionAndSuggestion: { conclusion: '', suggestion: '' },
  };
  analysis.conclusionAndSuggestion = generateSummaryConclusion(analysis, result.rhSummary, result.specialistReview);
  return analysis;
};

export const exportSummaryAnalysis = (result: AssessmentResult, format: 'json' | 'csv' = 'json', rhForm?: RHForm | null) => {
  const analysis = buildSummaryAnalysis(result);
  if (format === 'json') return downloadFile(`analisa-ringkas-${result.identity.name || result.id}.json`, JSON.stringify({ resultId: result.id, identity: result.identity, summaryAnalysis: analysis, rhForm: rhForm ?? null }, null, 2));
  const rows = [['section', 'item', 'value', 'category'], ['Sikap Terhadap Tes', analysis.testAttitude.label, analysis.testAttitude.score ?? '', analysis.testAttitude.narrative], ['Indeks Kapasitas Mental', 'Total', analysis.mentalCapacityIndex.total ?? '', analysis.mentalCapacityIndex.category], ...analysis.mentalCapacityIndex.variables.map((item) => ['Indeks Kapasitas Mental', item.label, item.value ?? 'Belum tersedia', item.category ?? '']), ['Indeks OCEAN', 'Total', analysis.basicPersonalityIndex.total ?? '', analysis.basicPersonalityIndex.category], ...analysis.basicPersonalityIndex.variables.map((item) => ['Indeks OCEAN', `${item.label}${item.englishLabel ? ` (${item.englishLabel})` : ''}`, item.value ?? 'Belum tersedia', item.category ?? '']), ['Kesimpulan', 'Kesimpulan', analysis.conclusionAndSuggestion.conclusion, analysis.conclusionAndSuggestion.suggestion]];
  return downloadFile(`analisa-ringkas-${result.identity.name || result.id}.csv`, rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n'), 'text/csv;charset=utf-8');
};

export const printSummaryAnalysis = () => {
  if (typeof document !== 'undefined') document.body.classList.add('print-summary-analysis');
  window.print();
  setTimeout(() => document.body.classList.remove('print-summary-analysis'), 500);
};

// Ensure the requested key is discoverable from shared storage constants without changing its literal value.
export const SUMMARY_ANALYSIS_STORAGE_KEY_ALIASES = { storage: STORAGE_KEYS.summaryAnalysisConfig };
