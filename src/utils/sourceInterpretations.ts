import type { DualInterpretations, InterpretationComparison, ScoreRow, ScoringConfig, SourceInterpretationConfig, SourceInterpretationResult, ValidityStatus, AssessmentResult } from '../types';
import { isDemoLikeConfig, type ValidationResult } from './configValidation';

const unavailable = (source: 'Rusdi Maslim' | 'Hubertus', message: string): SourceInterpretationResult => ({
  available: false,
  source,
  message,
  validityNarrative: message,
  clinicalNarrative: message,
  codeTypeNarrative: '',
  domainNarrative: '',
  recommendations: [],
  appendix: {},
});

const textOf = (value: unknown): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value !== 'object') return '';
  const row = value as Record<string, unknown>;
  return String(row.text ?? row.narrative ?? row.description ?? row.summary ?? row.interpretation ?? '').trim();
};

const entriesForScale = (rules: unknown, score: ScoreRow) => {
  const key = score.code ?? score.scaleId;
  const all = (rules ?? {}) as Record<string, unknown>;
  const raw = all[key] ?? all[score.scaleId] ?? (score.code ? all[score.code] : undefined);
  return Array.isArray(raw) ? raw : raw ? [raw] : [];
};

const ruleMatchesScore = (rule: unknown, score: ScoreRow) => {
  if (typeof rule !== 'object' || !rule) return Boolean(textOf(rule));
  const row = rule as Record<string, unknown>;
  const minT = Number(row.minT ?? row.min ?? row.tMin ?? row.minTScore);
  const maxT = Number(row.maxT ?? row.max ?? row.tMax ?? row.maxTScore);
  const t = score.tScore;
  if (typeof t !== 'number') return false;
  if (Number.isFinite(minT) && t < minT) return false;
  if (Number.isFinite(maxT) && t > maxT) return false;
  return Boolean(textOf(rule));
};

const collectScaleNarratives = (scores: ScoreRow[], config: SourceInterpretationConfig) =>
  scores.flatMap((score) => entriesForScale(config.scaleInterpretations, score)
    .filter((rule) => ruleMatchesScore(rule, score))
    .map((rule) => `Menurut konfigurasi ${config.sourceName}, skala ${score.code ?? score.scaleId} (${score.scaleName}) berada pada T-score ${score.tScore ?? 'belum dikonversi'}: ${textOf(rule)}`));

const collectValidityNarratives = (validityStatus: ValidityStatus, config: SourceInterpretationConfig) => {
  const source = config.validityInterpretations ?? {};
  const values = [source[validityStatus.status], source[validityStatus.label], ...(validityStatus.flags ?? []).map((flag) => source[flag])].map(textOf).filter(Boolean);
  return values.length ? values.map((text) => `Menurut konfigurasi ${config.sourceName}, ${text}`).join('\n') : '';
};

const collectDomainNarratives = (scores: ScoreRow[], config: SourceInterpretationConfig) => {
  const domainRules = config.domainInterpretations ?? {};
  return Object.entries(domainRules).flatMap(([domain, raw]) => {
    const items = Array.isArray(raw) ? raw : [raw];
    const domainScores = scores.filter((score) => String(score.group ?? score.type ?? '').toLowerCase() === domain.toLowerCase());
    if (!domainScores.length) return [];
    return items.map(textOf).filter(Boolean).map((text) => `Menurut konfigurasi ${config.sourceName}, domain ${domain}: ${text}`);
  }).join('\n');
};

const collectRecommendations = (scores: ScoreRow[], validityStatus: ValidityStatus, config: SourceInterpretationConfig) => {
  const rules = config.recommendationRules ?? {};
  const values: string[] = [];
  Object.entries(rules).forEach(([key, raw]) => {
    const list = Array.isArray(raw) ? raw : [raw];
    const relatedScore = scores.find((score) => [score.scaleId, score.code, score.group, score.type].filter(Boolean).map(String).includes(key));
    list.forEach((rule) => {
      const text = textOf(rule);
      if (!text) return;
      if (relatedScore && !ruleMatchesScore(rule, relatedScore)) return;
      if (!relatedScore && key !== validityStatus.status && key !== 'general') return;
      values.push(`Menurut konfigurasi ${config.sourceName}, ${text}`);
    });
  });
  return values;
};

const collectCodeTypeNarrative = (scores: ScoreRow[], config: SourceInterpretationConfig) => {
  const elevated = scores.filter((score) => (score.tScore ?? 0) >= 65).sort((a, b) => (b.tScore ?? 0) - (a.tScore ?? 0)).slice(0, 2);
  const codes = elevated.map((score) => score.code ?? score.scaleId);
  const keys = [codes.join('-'), codes.join(''), codes.slice().reverse().join('-'), codes.slice().reverse().join('')].filter(Boolean);
  const rules = config.codeTypeInterpretations ?? {};
  const text = keys.map((key) => textOf(rules[key])).find(Boolean) ?? '';
  return text ? `Menurut konfigurasi ${config.sourceName}, code type ${codes.join('-')}: ${text}` : '';
};

export const validateSourceInterpretationConfig = (config: unknown, scoringConfig: ScoringConfig | null | undefined, expectedSource: 'Rusdi Maslim' | 'Hubertus'): ValidationResult => {
  const result: ValidationResult = { valid: true, errors: [], warnings: [] };
  const cfg = config as Partial<SourceInterpretationConfig> | null;
  if (!cfg || typeof cfg !== 'object') {
    result.errors.push(`Config ${expectedSource} belum tersedia.`);
    result.valid = false;
    return result;
  }
  if (cfg.sourceName !== expectedSource) result.errors.push(`sourceName harus “${expectedSource}”.`);
  ['validityInterpretations', 'scaleInterpretations', 'codeTypeInterpretations', 'domainInterpretations', 'recommendationRules', 'appendix'].forEach((field) => {
    if (!(field in cfg)) result.errors.push(`Harus punya ${field}.`);
  });
  const scaleKeys = new Set((scoringConfig?.scales ?? []).flatMap((scale) => [scale.id, scale.code].filter(Boolean).map(String)));
  Object.keys(cfg.scaleInterpretations ?? {}).forEach((key) => {
    if (scaleKeys.size && !scaleKeys.has(key)) result.errors.push(`Kode skala ${key} tidak ada di scoringConfig.`);
  });
  if (cfg.isDemo || isDemoLikeConfig(cfg)) result.warnings.push('Mode demo - tidak valid untuk laporan klinis/personel.');
  result.valid = result.errors.length === 0;
  return result;
};

export const validateRusdiConfig = (config: unknown, scoringConfig?: ScoringConfig | null) => validateSourceInterpretationConfig(config, scoringConfig, 'Rusdi Maslim');
export const validateHubertusConfig = (config: unknown, scoringConfig?: ScoringConfig | null) => validateSourceInterpretationConfig(config, scoringConfig, 'Hubertus');

const generateSourceInterpretation = (scores: ScoreRow[], validityStatus: ValidityStatus, config: unknown, source: 'Rusdi Maslim' | 'Hubertus'): SourceInterpretationResult => {
  const valid = validateSourceInterpretationConfig(config, null, source);
  if (!config || typeof config !== 'object') return unavailable(source, `Interpretasi ${source} belum tersedia.`);
  const cfg = config as SourceInterpretationConfig;
  if (cfg.isDemo || isDemoLikeConfig(cfg)) return { ...unavailable(source, 'Mode demo - tidak valid untuk laporan klinis/personel.'), isDemo: true };
  if (valid.errors.length) return unavailable(source, `Interpretasi ${source} belum tersedia.`);
  const clinical = collectScaleNarratives(scores, cfg).join('\n');
  return {
    available: Boolean(clinical || Object.keys(cfg.validityInterpretations ?? {}).length || Object.keys(cfg.codeTypeInterpretations ?? {}).length || Object.keys(cfg.domainInterpretations ?? {}).length),
    source,
    validityNarrative: collectValidityNarratives(validityStatus, cfg),
    clinicalNarrative: clinical,
    codeTypeNarrative: collectCodeTypeNarrative(scores, cfg),
    domainNarrative: collectDomainNarratives(scores, cfg),
    recommendations: collectRecommendations(scores, validityStatus, cfg),
    appendix: cfg.appendix ?? {},
  };
};

export const generateRusdiMaslimInterpretation = (scores: ScoreRow[], validityStatus: ValidityStatus, rusdiConfig: unknown) => generateSourceInterpretation(scores, validityStatus, rusdiConfig, 'Rusdi Maslim');
export const generateHubertusInterpretation = (scores: ScoreRow[], validityStatus: ValidityStatus, hubertusConfig: unknown) => generateSourceInterpretation(scores, validityStatus, hubertusConfig, 'Hubertus');

export const generateInterpretationComparison = (rusdiInterpretation: SourceInterpretationResult, hubertusInterpretation: SourceInterpretationResult): InterpretationComparison => {
  if (!rusdiInterpretation.available || !hubertusInterpretation.available) return { similarities: [], differences: [], cautionNotes: ['Perbandingan lengkap hanya tersedia jika kedua konfigurasi interpretasi valid dan tersedia.', 'Kesimpulan final memerlukan telaah spesialis.'], specialistRequired: true };
  const similarities = ['Kedua interpretasi sama-sama berasal dari satu data jawaban dan satu hasil skor peserta.', 'Kedua interpretasi sama-sama harus dibaca sebagai bahan telaah profesional, bukan diagnosis final otomatis.'];
  const differences = ['Terdapat perbedaan penekanan pada narasi, istilah, atau aturan yang dimuat dalam konfigurasi masing-masing sumber.', 'Menurut konfigurasi Rusdi Maslim dan menurut konfigurasi Hubertus, bagian yang berbeda perlu ditelaah berdampingan oleh spesialis.'];
  return { similarities, differences, cautionNotes: ['Kesimpulan final memerlukan telaah spesialis.', 'Laporan otomatis ini tidak boleh menjadi satu-satunya dasar keputusan klinis atau personel.'], specialistRequired: true };
};

export const buildDualInterpretations = (scores: ScoreRow[], validityStatus: ValidityStatus, rusdiConfig: unknown, hubertusConfig: unknown): DualInterpretations => {
  const rusdiMaslim = generateRusdiMaslimInterpretation(scores, validityStatus, rusdiConfig);
  const hubertus = generateHubertusInterpretation(scores, validityStatus, hubertusConfig);
  return { rusdiMaslim, hubertus, comparison: generateInterpretationComparison(rusdiMaslim, hubertus) };
};

export const generateFinalSpecialistReview = (result: AssessmentResult, selectedMode: AssessmentResult['specialistReview'] extends infer R ? string : string) => ({
  ...(result.specialistReview ?? {}),
  status: selectedMode === 'not_selected' ? 'pending' : 'reviewed',
  selectedFinalInterpretation: selectedMode,
  reviewedAt: new Date().toISOString(),
  isLocked: false,
});
