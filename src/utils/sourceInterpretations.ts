import type { AssessmentResult, DualInterpretations, InterpretationComparison, ScaleConfig, ScoreRow, ScoringConfig, SourceCodeTypeConfig, SourceInterpretationConfig, SourceInterpretationResult, ValidityStatus } from '../types';
import { isDemoLikeConfig, type ValidationResult } from './configValidation';

export type InterpretationSourceName = 'Rusdi Maslim' | 'Hubertus';

const STORAGE_BY_SOURCE = {
  'Rusdi Maslim': {
    interpretation: 'sppg_mmpi2_interpretation_rusdi_maslim',
    codeType: 'sppg_mmpi2_code_type_rusdi_maslim',
  },
  Hubertus: {
    interpretation: 'sppg_mmpi2_interpretation_hubertus',
    codeType: 'sppg_mmpi2_code_type_hubertus',
  },
} as const;

const AUTO_DEFAULT_DISCLAIMER = 'Konfigurasi ini dibuat otomatis untuk kebutuhan teknis aplikasi. Bukan kutipan manual asli dan bukan interpretasi resmi.';
const AUTO_DEFAULT_REPORT_DISCLAIMER = 'Interpretasi ini menggunakan konfigurasi auto-default yang bersifat generik dan bukan kutipan manual. Kesimpulan final wajib ditetapkan oleh spesialis/dokter jiwa/psikolog klinis.';

const readLocalJson = <T,>(key: string): T | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const writeLocalJson = (key: string, value: unknown) => {
  if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(value));
};

const scaleKeys = (scale: ScaleConfig) => [scale.code, scale.id].filter(Boolean).map(String);
const scaleGroup = (scale: ScaleConfig) => String(scale.group ?? scale.type ?? 'other').toLowerCase();

const genericRules = (group: string) => {
  const isValidity = group === 'validity';
  const clinicalContext = 'Skala ini menunjukkan area yang perlu dipahami dalam konteks keseluruhan profil. Elevasi tidak sama dengan diagnosis dan harus dikonfirmasi oleh profesional berwenang.';
  return [
    { minT: -999, maxT: 49, category: 'Rendah', narrative: isValidity ? 'Indikator validitas tidak menunjukkan hambatan besar berdasarkan konfigurasi yang tersedia.' : 'Skor berada di bawah rerata konfigurasi. Makna klinis perlu dilihat bersama skala lain dan hasil wawancara.', context: isValidity ? undefined : clinicalContext },
    { minT: 50, maxT: 59, category: 'Dalam batas umum', narrative: isValidity ? 'Indikator validitas tidak menunjukkan hambatan besar berdasarkan konfigurasi yang tersedia.' : 'Skor berada dalam rentang umum. Tidak tampak elevasi bermakna pada skala ini berdasarkan konfigurasi yang tersedia.', context: isValidity ? undefined : clinicalContext },
    { minT: 60, maxT: 64, category: 'Area waspada', narrative: isValidity ? 'Terdapat indikator validitas yang perlu ditelaah. Interpretasi profil harus dilakukan hati-hati dan dikonfirmasi dengan wawancara.' : 'Skor berada pada area waspada. Temuan ini perlu dikonfirmasi dengan wawancara, observasi, dan data pendukung.', context: isValidity ? undefined : clinicalContext },
    { minT: 65, maxT: 74, category: 'Elevated', narrative: isValidity ? 'Terdapat indikator validitas yang perlu ditelaah. Interpretasi profil harus dilakukan hati-hati dan dikonfirmasi dengan wawancara.' : 'Skor menunjukkan elevasi yang perlu ditelaah lebih lanjut. Interpretasi tidak boleh berdiri sendiri dan memerlukan review profesional.', context: isValidity ? undefined : clinicalContext },
    { minT: 75, maxT: 999, category: 'High elevated', narrative: isValidity ? 'Profil memerlukan review profesional. Interpretasi klinis otomatis sebaiknya dibatasi sampai validitas ditelaah.' : 'Skor menunjukkan elevasi tinggi yang memerlukan evaluasi profesional lebih lanjut. Temuan ini bukan diagnosis final.', context: isValidity ? undefined : clinicalContext },
  ];
};

export const createDefaultScaleInterpretations = (scales: ScaleConfig[] = [], _sourceName: InterpretationSourceName) => scales.reduce<Record<string, unknown>>((acc, scale) => {
  const rules = genericRules(scaleGroup(scale)).map((rule) => ({ ...rule, text: [rule.narrative, rule.context].filter(Boolean).join(' ') }));
  scaleKeys(scale).forEach((key) => { acc[key] = rules; });
  return acc;
}, {});

export const createDefaultDomainInterpretations = (_sourceName: InterpretationSourceName) => ({
  emotionalDistress: { title: 'Regulasi Emosi dan Distress', narrative: 'Area ini menggambarkan kemungkinan tekanan emosional, ketegangan, atau keluhan psikologis yang perlu dikonfirmasi secara klinis.' },
  somaticConcern: { title: 'Keluhan Somatik', narrative: 'Area ini menggambarkan kecenderungan keluhan fisik atau perhatian terhadap kesehatan yang dapat berkaitan dengan faktor psikologis maupun medis.' },
  thoughtPerception: { title: 'Pikiran dan Persepsi', narrative: 'Area ini menggambarkan aspek pola pikir, persepsi, dan sensitivitas terhadap lingkungan yang perlu ditelaah secara profesional bila meningkat.' },
  behavioralControl: { title: 'Kontrol Perilaku', narrative: 'Area ini menggambarkan aspek kontrol impuls, kepatuhan terhadap aturan, dan regulasi perilaku.' },
  interpersonal: { title: 'Fungsi Interpersonal', narrative: 'Area ini menggambarkan pola hubungan sosial, sensitivitas interpersonal, dan adaptasi dalam lingkungan sosial/kerja.' },
  workMilitaryAdaptation: { title: 'Adaptasi Kerja/Militer', narrative: 'Area ini menggambarkan aspek yang relevan untuk adaptasi kerja, toleransi stres, kerja tim, dan kebutuhan telaah lanjutan dalam konteks institusi.' },
});

export const createDefaultRecommendationRules = (_sourceName: InterpretationSourceName) => ([
  { id: 'validity_invalid', condition: 'validity_invalid', text: 'Disarankan review/retest sebelum membuat kesimpulan.' },
  { id: 't_score_high_elevated', condition: 'any_t_score_gte_75', text: 'Disarankan evaluasi profesional lanjutan terhadap skala yang menonjol.' },
  { id: 't_score_elevated', condition: 'any_t_score_65_74', text: 'Disarankan wawancara klinis terarah untuk mengonfirmasi temuan.' },
  { id: 'no_meaningful_elevation', condition: 'no_t_score_gte_65', text: 'Tidak terdapat elevasi bermakna berdasarkan konfigurasi yang tersedia, namun tetap perlu mempertimbangkan konteks asesmen.' },
]);

export const createDefaultAppendix = (_sourceName: InterpretationSourceName) => ({
  tScore: 'T-score adalah skor standar untuk membantu membaca posisi skor terhadap konfigurasi norma yang tersedia.',
  rawScore: 'Raw score adalah jumlah skor awal sebelum konversi ke T-score.',
  validityScales: 'Skala validitas membantu menilai kehati-hatian dalam membaca profil dan tidak menggantikan telaah profesional.',
  clinicalScales: 'Skala klinis menggambarkan area yang perlu dipahami dalam konteks keseluruhan profil.',
  limitations: 'Interpretasi otomatis bersifat generik, non-diagnostik, dan wajib dikonfirmasi melalui wawancara serta data pendukung.',
  disclaimer: AUTO_DEFAULT_DISCLAIMER,
});

const createDefaultInterpretationConfig = (sourceName: InterpretationSourceName, scoringConfig?: ScoringConfig | null): SourceInterpretationConfig => ({
  sourceName,
  version: 'auto-default-v1',
  isDemo: false,
  isAutoDefault: true,
  isOfficial: false,
  licenseStatus: 'auto_default_not_manual_content',
  createdAt: new Date().toISOString(),
  disclaimer: AUTO_DEFAULT_DISCLAIMER,
  validityInterpretations: {
    valid: 'Indikator validitas tidak menunjukkan hambatan besar berdasarkan konfigurasi yang tersedia.',
    caution: 'Terdapat indikator validitas yang perlu ditelaah. Interpretasi profil harus dilakukan hati-hati dan dikonfirmasi dengan wawancara.',
    invalid: 'Profil memerlukan review profesional. Interpretasi klinis otomatis sebaiknya dibatasi sampai validitas ditelaah.',
  },
  scaleInterpretations: createDefaultScaleInterpretations(scoringConfig?.scales ?? [], sourceName),
  codeTypeInterpretations: {},
  domainInterpretations: createDefaultDomainInterpretations(sourceName),
  recommendationRules: createDefaultRecommendationRules(sourceName),
  appendix: createDefaultAppendix(sourceName),
});

export const createDefaultRusdiMaslimInterpretationConfig = (scoringConfig?: ScoringConfig | null) => createDefaultInterpretationConfig('Rusdi Maslim', scoringConfig);
export const createDefaultHubertusInterpretationConfig = (scoringConfig?: ScoringConfig | null) => createDefaultInterpretationConfig('Hubertus', scoringConfig);

export const createDefaultCodeTypeConfig = (sourceName: InterpretationSourceName): SourceCodeTypeConfig => ({
  sourceName,
  version: 'auto-default-v1',
  isAutoDefault: true,
  isOfficial: false,
  rules: [],
  message: 'Code type specific interpretation belum tersedia. Sistem hanya menampilkan code type numerik dan membutuhkan interpretasi profesional.',
});
export const createDefaultRusdiMaslimCodeTypeConfig = () => createDefaultCodeTypeConfig('Rusdi Maslim');
export const createDefaultHubertusCodeTypeConfig = () => createDefaultCodeTypeConfig('Hubertus');

const sourceDefaultFactory = (sourceName: InterpretationSourceName, scoringConfig?: ScoringConfig | null) => sourceName === 'Rusdi Maslim' ? createDefaultRusdiMaslimInterpretationConfig(scoringConfig) : createDefaultHubertusInterpretationConfig(scoringConfig);

export const ensureInterpretationConfigsExist = (scoringConfig?: ScoringConfig | null) => {
  let changed = false;
  (Object.keys(STORAGE_BY_SOURCE) as InterpretationSourceName[]).forEach((sourceName) => {
    const keys = STORAGE_BY_SOURCE[sourceName];
    const existingInterpretation = readLocalJson<Partial<SourceInterpretationConfig>>(keys.interpretation);
    if (!existingInterpretation) { writeLocalJson(keys.interpretation, sourceDefaultFactory(sourceName, scoringConfig)); changed = true; }
    else if (existingInterpretation.isAutoDefault && !existingInterpretation.isOfficial && scoringConfig?.scales?.length) {
      const currentScales = existingInterpretation.scaleInterpretations ?? {};
      const expectedKeys = scoringConfig.scales.flatMap(scaleKeys);
      const hasMissingScale = expectedKeys.some((key) => !(key in currentScales));
      if (hasMissingScale) {
        writeLocalJson(keys.interpretation, { ...sourceDefaultFactory(sourceName, scoringConfig), createdAt: existingInterpretation.createdAt ?? new Date().toISOString() });
        changed = true;
      }
    }
    const existingCodeType = readLocalJson<Partial<SourceCodeTypeConfig>>(keys.codeType);
    if (!existingCodeType) { writeLocalJson(keys.codeType, createDefaultCodeTypeConfig(sourceName)); changed = true; }
  });
  return changed;
};

export const initializeDefaultInterpretationConfigs = (scoringConfig?: ScoringConfig | null) => ensureInterpretationConfigsExist(scoringConfig);

export const restoreAutoDefaultInterpretationConfig = (sourceName: InterpretationSourceName, scoringConfig?: ScoringConfig | null) => {
  const keys = STORAGE_BY_SOURCE[sourceName];
  const interpretation = sourceDefaultFactory(sourceName, scoringConfig);
  const codeType = createDefaultCodeTypeConfig(sourceName);
  writeLocalJson(keys.interpretation, interpretation);
  writeLocalJson(keys.codeType, codeType);
  return { interpretation, codeType };
};

export const validateInterpretationConfig = (config: unknown, _scoringConfig?: ScoringConfig | null) => {
  if (config && typeof config === 'object' && (config as Partial<SourceInterpretationConfig>).isAutoDefault) return {
    structurallyValid: true,
    clinicallyOfficial: false,
    status: 'auto_default_available',
    message: 'Config tersedia secara otomatis untuk preview teknis, tetapi belum diverifikasi sebagai interpretasi resmi.',
  };
  const structurallyValid = Boolean(config && typeof config === 'object');
  return {
    structurallyValid,
    clinicallyOfficial: Boolean((config as Partial<SourceInterpretationConfig> | null)?.isOfficial),
    status: structurallyValid ? 'available' : 'not_available',
    message: structurallyValid ? 'Config tersedia.' : 'Config belum tersedia.',
  };
};

const unavailable = (source: InterpretationSourceName, message: string): SourceInterpretationResult => ({
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
  const title = row.title ? `${String(row.title).trim()}: ` : '';
  return `${title}${String(row.text ?? row.narrative ?? row.description ?? row.summary ?? row.interpretation ?? '').trim()}`.trim();
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
    if (!domainScores.length && !config.isAutoDefault) return [];
    return items.map(textOf).filter(Boolean).map((text) => `Menurut konfigurasi ${config.sourceName}, domain ${domain}: ${text}`);
  }).join('\n');
};

const recommendationRuleMatches = (rule: Record<string, unknown>, scores: ScoreRow[], validityStatus: ValidityStatus) => {
  const condition = String(rule.condition ?? rule.when ?? '');
  if (condition === 'validity_invalid') return validityStatus.status === 'invalid' || Boolean(validityStatus.requiresRetest);
  if (condition === 'any_t_score_gte_75') return scores.some((score) => (score.tScore ?? 0) >= 75);
  if (condition === 'any_t_score_65_74') return scores.some((score) => (score.tScore ?? 0) >= 65 && (score.tScore ?? 0) <= 74);
  if (condition === 'no_t_score_gte_65') return !scores.some((score) => (score.tScore ?? 0) >= 65);
  return true;
};

const collectRecommendations = (scores: ScoreRow[], validityStatus: ValidityStatus, config: SourceInterpretationConfig) => {
  const rules = config.recommendationRules ?? {};
  const values: string[] = [];
  if (Array.isArray(rules)) {
    rules.forEach((rule) => {
      const text = textOf(rule);
      if (!text) return;
      if (typeof rule === 'object' && rule && !recommendationRuleMatches(rule as Record<string, unknown>, scores, validityStatus)) return;
      values.push(`Menurut konfigurasi ${config.sourceName}, ${text}`);
    });
    return values;
  }
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
  if (text) return `Menurut konfigurasi ${config.sourceName}, code type ${codes.join('-')}: ${text}`;
  if (config.isAutoDefault && codes.length) return 'Code type terdeteksi secara numerik, tetapi interpretasi spesifik belum tersedia pada konfigurasi auto-default.';
  return '';
};

export const validateSourceInterpretationConfig = (config: unknown, scoringConfig: ScoringConfig | null | undefined, expectedSource: InterpretationSourceName): ValidationResult => {
  const result: ValidationResult = { valid: true, errors: [], warnings: [] };
  const cfg = config as Partial<SourceInterpretationConfig> | null;
  if (!cfg || typeof cfg !== 'object') {
    result.errors.push(`Config ${expectedSource} belum tersedia.`);
    result.valid = false;
    return result;
  }
  if (cfg.sourceName !== expectedSource) result.errors.push(`sourceName harus “${expectedSource}”.`);
  ['validityInterpretations', 'scaleInterpretations', 'domainInterpretations', 'recommendationRules', 'appendix'].forEach((field) => {
    if (!(field in cfg)) result.errors.push(`Harus punya ${field}.`);
  });
  const scaleKeySet = new Set((scoringConfig?.scales ?? []).flatMap((scale) => [scale.id, scale.code].filter(Boolean).map(String)));
  Object.keys(cfg.scaleInterpretations ?? {}).forEach((key) => {
    if (scaleKeySet.size && !scaleKeySet.has(key)) result.errors.push(`Kode skala ${key} tidak ada di scoringConfig.`);
  });
  if (cfg.isAutoDefault) result.warnings.push('Auto-default tersedia: valid secara struktur, tetapi perlu verifikasi admin/spesialis dan belum final/resmi.');
  if (cfg.isDemo || isDemoLikeConfig(cfg)) result.warnings.push('Mode demo - tidak valid untuk laporan klinis/personel.');
  result.valid = result.errors.length === 0;
  return result;
};

export const validateRusdiConfig = (config: unknown, scoringConfig?: ScoringConfig | null) => validateSourceInterpretationConfig(config, scoringConfig, 'Rusdi Maslim');
export const validateHubertusConfig = (config: unknown, scoringConfig?: ScoringConfig | null) => validateSourceInterpretationConfig(config, scoringConfig, 'Hubertus');

const generateSourceInterpretation = (scores: ScoreRow[], validityStatus: ValidityStatus, config: unknown, source: InterpretationSourceName): SourceInterpretationResult => {
  const valid = validateSourceInterpretationConfig(config, null, source);
  if (!config || typeof config !== 'object') return unavailable(source, `Interpretasi ${source} belum tersedia.`);
  const cfg = config as SourceInterpretationConfig;
  if (cfg.isDemo || isDemoLikeConfig(cfg)) return { ...unavailable(source, 'Mode demo - tidak valid untuk laporan klinis/personel.'), isDemo: true };
  if (valid.errors.length) return unavailable(source, `Interpretasi ${source} belum tersedia.`);
  const clinical = collectScaleNarratives(scores, cfg).join('\n');
  return {
    available: Boolean(clinical || Object.keys(cfg.validityInterpretations ?? {}).length || Object.keys(cfg.codeTypeInterpretations ?? {}).length || Object.keys(cfg.domainInterpretations ?? {}).length || cfg.isAutoDefault),
    source,
    isAutoDefault: Boolean(cfg.isAutoDefault),
    isOfficial: Boolean(cfg.isOfficial),
    disclaimer: cfg.isAutoDefault ? AUTO_DEFAULT_REPORT_DISCLAIMER : cfg.disclaimer,
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
