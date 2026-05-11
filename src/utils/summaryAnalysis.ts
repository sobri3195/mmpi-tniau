import type { AssessmentResult, RHForm, RHSummary, ScoreRow, ScoringConfig, SpecialistReview, SummaryAnalysisConfig, SummaryAnalysisResult, SummaryAnalysisValidationResult, SummaryAnalysisVariableConfig, SummaryAnalysisVariableResult, ValidityStatus } from '../types';
import { downloadFile } from './export';
import { STORAGE_KEYS } from './storage';

export const SUMMARY_ANALYSIS_CONFIG_KEY = 'sppg_mmpi2_summary_analysis_config';
export const MISSING_VALUE_LABEL = 'Belum tersedia karena sumber skala tidak ditemukan.';
export const AUTO_DEFAULT_BADGE_LABEL = 'Auto-default — perlu verifikasi spesialis';
export const AUTO_DEFAULT_REPORT_BADGE_LABEL = 'Analisa Ringkas auto-default — perlu verifikasi spesialis';
export const AUTO_DEFAULT_DISCLAIMER = 'Analisa Ringkas ini menggunakan konfigurasi auto-default yang bersifat generik dan bukan formula resmi. Kesimpulan akhir wajib ditetapkan oleh spesialis/dokter jiwa/psikolog klinis.';

const formulaPlaceholder = (formula?: string) => !formula || formula.trim() === '' || formula.trim() === 'admin_config_formula';
const scoreKey = (score: ScoreRow) => [score.scaleId, score.code, score.scaleName].filter(Boolean).map((item) => String(item).toLowerCase());
const hasScore = (scores: ScoreRow[], source: string) => scores.some((score) => scoreKey(score).includes(source.toLowerCase()));
const findScore = (scores: ScoreRow[], source: string) => scores.find((score) => scoreKey(score).includes(source.toLowerCase()));
const scaleValue = (score?: ScoreRow) => score?.tScore ?? score?.rawScore;
const sourceScaleSet = (scoringConfig?: ScoringConfig | null) => new Set((scoringConfig?.scales ?? []).flatMap((scale) => [scale.id, scale.code, scale.name].filter(Boolean).map(String)));
const sourceAvailableInConfig = (source: string, scales: Set<string>) => !scales.size || scales.has(source);

const categoryRules = [
  { min: 0, max: 2, label: 'Sangat Buruk' },
  { min: 3, max: 4, label: 'Buruk' },
  { min: 5, max: 6, label: 'Sedang' },
  { min: 7, max: 8, label: 'Baik' },
  { min: 9, max: 10, label: 'Sangat Baik' },
];

export const createDefaultSummaryAnalysisConfig = (scoringConfig?: ScoringConfig | null): SummaryAnalysisConfig => {
  const scales = sourceScaleSet(scoringConfig);
  const keepKnown = (sources: string[]) => scales.size ? sources.filter((source) => sourceAvailableInConfig(source, scales)) : sources;
  const withFallback = (sources: string[]) => keepKnown(sources).length ? keepKnown(sources) : sources;
  return {
    configName: 'Analisa Ringkas TNI AU - Auto Default',
    version: 'auto-default-v1',
    source: 'system-generated',
    isDemo: false,
    isAutoDefault: true,
    isOfficial: false,
    isFinal: false,
    licenseStatus: 'auto_default_not_official',
    createdAt: new Date().toISOString(),
    disclaimer: 'Konfigurasi ini dibuat otomatis untuk kebutuhan teknis aplikasi. Bukan formula resmi dan wajib diverifikasi oleh spesialis/admin.',
    validityAttitude: {
      title: 'Sikap Terhadap Tes',
      sourceScales: withFallback(['L', 'F', 'K', 'VRIN', 'TRIN']),
      scoreRules: [
        { score: 0, label: 'Tidak valid', description: 'Profil belum memadai untuk interpretasi. Disarankan review atau retest.' },
        { score: 1, label: 'Masih valid dengan modifikasi', description: 'Profil dapat ditelaah secara terbatas dengan kehati-hatian.' },
        { score: 2, label: 'Valid', description: 'Profil dapat ditelaah sesuai konfigurasi yang tersedia.' },
      ],
      narrativeTemplates: {
        '0': 'Berdasarkan indikator validitas, profil respons belum memadai untuk interpretasi final. Disarankan review atau retest oleh profesional berwenang.',
        '1': 'Responden telah menyelesaikan tes, namun terdapat indikator validitas yang perlu diperhatikan. Hasil masih dapat ditelaah dengan modifikasi dan kehati-hatian.',
        '2': 'Responden menyelesaikan tes secara memadai dan profil dapat ditelaah berdasarkan konfigurasi yang tersedia.',
      },
    },
    mentalCapacityIndex: {
      title: 'Indeks Kapasitas Mental',
      isAutoDefault: true,
      variables: [
        { id: 'potensi_kinerja', label: 'Potensi Kinerja', rangeDescription: '0=kurang, 1=sedang, 2=besar', sourceScales: withFallback(['D', 'Pt', 'Sc', 'Ma', 'Si', 'WRK']), autoRule: 'Jika tidak ada elevasi tinggi pada skala klinis/domain kerja, beri nilai lebih tinggi; jika ada elevasi tinggi, beri nilai lebih rendah.', fallbackValue: null },
        { id: 'kemampuan_adaptasi', label: 'Kemampuan Adaptasi', rangeDescription: '0=kurang, 1=sedang, 2=besar', sourceScales: withFallback(['K', 'Si', 'RCd', 'RC7', 'WRK']), autoRule: 'Dinilai dari stabilitas profil, validitas, dan domain adaptasi sosial/kerja.', fallbackValue: null },
        { id: 'kendala_psikologis', label: 'Kendala Psikologis', rangeDescription: '0=berat, 1=sedang, 2=ringan', sourceScales: withFallback(['D', 'Pt', 'Sc', 'RCd', 'RC7', 'RC8']), autoRule: 'Semakin banyak elevasi klinis, nilai semakin rendah.', fallbackValue: null },
        { id: 'perilaku_berisiko', label: 'Perilaku Berisiko', rangeDescription: '0=besar, 1=sedang, 2=kecil', sourceScales: withFallback(['Pd', 'Ma', 'RC4', 'RC9', 'ASP', 'DISC']), autoRule: 'Semakin tinggi indikator perilaku berisiko, nilai semakin rendah.', fallbackValue: null },
        { id: 'integritas_moral', label: 'Integritas Moral', rangeDescription: '0=rendah, 1=sedang, 2=tinggi', sourceScales: withFallback(['L', 'K', 'Pd', 'RC4', 'ASP', 'Re']), autoRule: 'Dinilai secara generik dari pola validitas dan indikator perilaku/norma.', fallbackValue: null },
      ],
      totalScore: { min: 0, max: 10, label: 'Indeks Kapasitas Mental' },
      categoryRules,
    },
    clinicalProfile: {
      title: 'Profil Klinis',
      isAutoDefault: true,
      sourceScales: withFallback(['Hs', 'D', 'Hy', 'Pd', 'Pa', 'Pt', 'Sc', 'Ma', 'Si', 'RCd', 'RC1', 'RC2', 'RC3', 'RC4', 'RC6', 'RC7', 'RC8', 'RC9']),
      narrativeRules: [
        { domain: 'somaticConcern', condition: 'domain_elevated', sourceScales: withFallback(['Hs', 'Hy', 'RC1', 'HEA']), text: 'Terdapat indikasi keluhan somatik atau perhatian terhadap kondisi fisik yang perlu dikonfirmasi melalui wawancara dan data medis.' },
        { domain: 'emotionalDistress', condition: 'domain_elevated', sourceScales: withFallback(['D', 'Pt', 'RCd', 'RC2', 'RC7', 'ANX']), text: 'Terdapat indikasi tekanan emosional atau distress yang perlu ditelaah lebih lanjut.' },
        { domain: 'thoughtPerception', condition: 'domain_elevated', sourceScales: withFallback(['Pa', 'Sc', 'RC6', 'RC8', 'BIZ', 'PSYC']), text: 'Terdapat indikator pada area pikiran/persepsi yang memerlukan telaah profesional.' },
        { domain: 'behavioralControl', condition: 'domain_elevated', sourceScales: withFallback(['Pd', 'Ma', 'RC4', 'RC9', 'ASP', 'DISC']), text: 'Terdapat indikator pada area kontrol perilaku atau impuls yang perlu dievaluasi lebih lanjut.' },
        { domain: 'interpersonal', condition: 'domain_elevated', sourceScales: withFallback(['Si', 'SOD', 'INTR', 'RC3']), text: 'Terdapat indikator pada area hubungan interpersonal dan adaptasi sosial yang perlu dikonfirmasi.' },
      ],
      noElevationText: 'Tidak terdapat indikasi klinis menonjol berdasarkan konfigurasi auto-default yang tersedia.',
    },
    basicPersonalityIndex: {
      title: 'Indeks Kepribadian Dasar',
      name: 'Indeks Kepribadian Dasar',
      model: 'OCEAN',
      isAutoDefault: true,
      variables: [
        { id: 'openness', label: 'Keterbukaan Pikiran', englishLabel: 'Openness', rangeDescription: '0=kurang, 1=sedang, 2=besar', sourceScales: withFallback(['RC8', 'PSYC', 'BIZ']), autoRule: 'Mapping generik; bukan formula resmi.' },
        { id: 'conscientiousness', label: 'Keterbukaan Hati', englishLabel: 'Conscientiousness', rangeDescription: '0=kurang, 1=sedang, 2=besar', sourceScales: withFallback(['Re', 'Do', 'Pd', 'RC4', 'DISC']), autoRule: 'Mapping generik; bukan formula resmi.' },
        { id: 'extraversion', label: 'Keterbukaan terhadap Orang Lain', englishLabel: 'Extraversion', rangeDescription: '0=kurang, 1=sedang, 2=besar', sourceScales: withFallback(['Si', 'SOD', 'INTR']), autoRule: 'Mapping generik; bukan formula resmi.' },
        { id: 'agreeableness', label: 'Keterbukaan terhadap Kesepakatan', englishLabel: 'Agreeableness', rangeDescription: '0=kurang, 1=sedang, 2=besar', sourceScales: withFallback(['CYN', 'ANG', 'Pa', 'RC3', 'AGGR']), autoRule: 'Mapping generik; bukan formula resmi.' },
        { id: 'neuroticism', label: 'Keterbukaan terhadap Tekanan', englishLabel: 'Neuroticism', rangeDescription: '0=kurang, 1=sedang, 2=besar', sourceScales: withFallback(['D', 'Pt', 'RCd', 'RC7', 'ANX', 'NEGE']), autoRule: 'Mapping generik; bukan formula resmi.' },
      ],
      totalScore: { min: 0, max: 10, label: 'Indeks OCEAN' },
      categoryRules,
    },
    conclusionTemplates: {
      valid: 'Berdasarkan skor validitas, indeks kapasitas mental, indeks kepribadian dasar, dan profil klinis, hasil ini dapat ditelaah lebih lanjut oleh pemeriksa berwenang.',
      caution: 'Interpretasi perlu dilakukan secara hati-hati karena terdapat indikator yang memerlukan konfirmasi melalui wawancara klinis.',
      invalid: 'Profil belum memadai untuk kesimpulan final. Disarankan review atau retest oleh profesional berwenang.',
      pending: 'Analisa ringkas belum final dan memerlukan verifikasi spesialis.',
    },
    suggestionTemplates: {
      no_elevation: 'Tidak terdapat elevasi menonjol berdasarkan konfigurasi auto-default. Tetap pertimbangkan wawancara dan RH Skrining.',
      moderate_elevation: 'Disarankan wawancara terarah pada area yang menonjol.',
      high_elevation: 'Disarankan evaluasi profesional lanjutan.',
      rh_redflag: 'Temuan RH Skrining menunjukkan red flag yang perlu ditelaah oleh spesialis.',
    },
    appendix: {
      validity: 'Validitas menilai kecukupan pola respons sebagai dasar telaah teknis.',
      mentalCapacityIndex: 'Indeks Kapasitas Mental auto-default memakai skor 0–2 per variabel dari elevasi T-score yang tersedia; ini bukan formula resmi.',
      clinicalProfile: 'Profil Klinis menyusun narasi generik jika domain terkait menunjukkan elevasi pada skala sumber yang tersedia.',
      ocean: 'Indeks Kepribadian Dasar/OCEAN memakai mapping generik terhadap skala yang tersedia dan wajib diganti bila admin memiliki konfigurasi resmi/berizin.',
      limitations: 'Auto-default hanya untuk menjalankan preview teknis, bukan standar final, diagnosis, atau rekomendasi klinis resmi.',
      disclaimer: 'Konfigurasi ini dibuat otomatis untuk kebutuhan teknis aplikasi. Bukan formula resmi dan wajib diverifikasi oleh spesialis/admin.',
    },
  };
};

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

export const initializeDefaultSummaryAnalysisConfig = (scoringConfig?: ScoringConfig | null) => {
  if (typeof window === 'undefined') return null;
  const existing = loadSummaryAnalysisConfig();
  if (existing) return existing;
  const config = createDefaultSummaryAnalysisConfig(scoringConfig);
  saveSummaryAnalysisConfig(config);
  return config;
};

export const ensureSummaryAnalysisConfigExists = (scoringConfig?: ScoringConfig | null) => initializeDefaultSummaryAnalysisConfig(scoringConfig);

export const restoreAutoDefaultSummaryAnalysisConfig = (scoringConfig?: ScoringConfig | null) => {
  const config = createDefaultSummaryAnalysisConfig(scoringConfig);
  saveSummaryAnalysisConfig(config);
  return config;
};

const validateVariables = (name: string, variables: SummaryAnalysisVariableConfig[] | undefined, scoringConfig?: ScoringConfig | null) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!variables?.length) {
    warnings.push(`${name}: daftar variabel belum tersedia.`);
    return { errors, warnings, missingSources: false };
  }
  const scaleIds = sourceScaleSet(scoringConfig);
  let missingSources = false;
  variables.forEach((variable) => {
    if (!variable.id || !variable.label) errors.push(`${name}: variabel wajib memiliki id dan label.`);
    if (!variable.sourceScales?.length) warnings.push(`${name}/${variable.label}: sourceScales kosong; nilai tidak akan dihitung.`);
    if (!variable.formula && !variable.autoRule) warnings.push(`${name}/${variable.label}: formula/rule belum tersedia; nilai akan ditampilkan sebagai belum tersedia.`);
    variable.sourceScales?.forEach((source) => {
      if (scaleIds.size && !sourceAvailableInConfig(source, scaleIds)) {
        missingSources = true;
        warnings.push(`${name}/${variable.label}: source scale "${source}" tidak ditemukan pada scoringConfig.`);
      }
    });
  });
  return { errors, warnings, missingSources };
};

export const validateSummaryAnalysisConfig = (config: SummaryAnalysisConfig | null, scoringConfig?: ScoringConfig | null): SummaryAnalysisValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!config) return { valid: false, structurallyValid: false, formulaAvailable: false, sourceScalesChecked: false, clinicallyOfficial: false, status: 'missing', message: 'Konfigurasi Analisa Ringkas belum tersedia.', errors: ['Konfigurasi Analisa Ringkas belum tersedia.'], warnings: [] };
  if (!config.configName) errors.push('configName wajib diisi.');
  if (!config.version) warnings.push('version belum diisi.');
  if (config.isDemo) warnings.push('Analisa Ringkas masih demo dan tidak valid untuk laporan final.');
  if (config.isAutoDefault && config.isFinal && !config.verifiedBy && !config.verificationNote) errors.push('Auto-default belum dapat dijadikan final tanpa verifikasi spesialis/admin.');
  if (!config.validityAttitude?.scoreRules?.length) warnings.push('Validity attitude rules belum lengkap.');
  if (!config.validityAttitude?.sourceScales?.length) warnings.push('Validity attitude sourceScales kosong.');
  const mental = validateVariables('Indeks Kapasitas Mental', config.mentalCapacityIndex?.variables, scoringConfig);
  const personality = validateVariables('Indeks Kepribadian Dasar', config.basicPersonalityIndex?.variables, scoringConfig);
  errors.push(...mental.errors, ...personality.errors);
  warnings.push(...mental.warnings, ...personality.warnings);
  if (mental.missingSources || personality.missingSources) warnings.push('Beberapa sumber skala tidak tersedia pada scoringConfig. Variabel terkait akan diberi status Belum tersedia.');
  if (!config.mentalCapacityIndex?.categoryRules?.length) warnings.push('Kategori Indeks Kapasitas Mental belum tersedia.');
  if (!config.basicPersonalityIndex?.categoryRules?.length) warnings.push('Kategori Indeks Kepribadian Dasar/OCEAN belum tersedia.');
  if (!config.clinicalProfile?.narrativeRules?.length) warnings.push('Clinical profile narrativeRules belum tersedia.');
  if (!config.conclusionTemplates) warnings.push('Conclusion templates belum tersedia.');
  const isAutoDefault = Boolean(config.isAutoDefault);
  return {
    valid: errors.length === 0,
    structurallyValid: errors.length === 0,
    formulaAvailable: Boolean(config.mentalCapacityIndex?.variables?.length && config.basicPersonalityIndex?.variables?.length && config.conclusionTemplates),
    sourceScalesChecked: true,
    clinicallyOfficial: Boolean(config.isOfficial && !isAutoDefault),
    status: isAutoDefault ? 'auto_default_available' : errors.length ? 'needs_fix' : 'custom_available',
    message: isAutoDefault ? 'Config tersedia otomatis untuk preview teknis, tetapi belum merupakan formula resmi.' : 'Config tersedia. Pastikan sumber dan izin formula sudah diverifikasi admin/spesialis.',
    errors,
    warnings,
  };
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

export const calculateAutoDefaultVariable = (scores: ScoreRow[], variableConfig: SummaryAnalysisVariableConfig): number | null => {
  const availableScores = (variableConfig.sourceScales ?? []).map((source) => findScore(scores, source)).filter((score): score is ScoreRow => Boolean(score) && Number.isFinite(score?.tScore ?? score?.rawScore));
  if (!availableScores.length) return null;
  const counts = availableScores.reduce((acc, score) => {
    const t = score.tScore ?? score.rawScore ?? 0;
    if (t >= 75) acc.high += 1;
    else if (t >= 65) acc.elevated += 1;
    else if (t >= 60) acc.caution += 1;
    return acc;
  }, { high: 0, elevated: 0, caution: 0 });
  const elevatedWeight = counts.high * 2 + counts.elevated;
  if (elevatedWeight >= 2 || counts.high >= 1) return 0;
  if (elevatedWeight === 1 || counts.caution >= 1) return 1;
  return 2;
};

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

const calculateIndex = (scores: ScoreRow[], variables: SummaryAnalysisVariableConfig[] = [], rules?: Array<{ min: number; max: number; label: string }>, autoDefault?: boolean) => {
  const warnings: string[] = [];
  const variableResults: SummaryAnalysisVariableResult[] = variables.map((variable) => {
    let warning = '';
    let value: number | null = null;
    const missingSources = (variable.sourceScales ?? []).filter((source) => !hasScore(scores, source));
    if (!variable.sourceScales?.length) warning = 'sourceScales belum tersedia.';
    else if (missingSources.length === variable.sourceScales.length) warning = MISSING_VALUE_LABEL;
    else if (autoDefault || variable.autoRule) value = calculateAutoDefaultVariable(scores, variable);
    else if (formulaPlaceholder(variable.formula)) warning = 'Formula belum tersedia.';
    else if (missingSources.length) warning = `sourceScales tidak ditemukan: ${missingSources.join(', ')}.`;
    else value = evaluateFormula(variable.formula!, scores, variable.sourceScales!);
    if (value === null && !warning) warning = autoDefault || variable.autoRule ? MISSING_VALUE_LABEL : 'Formula tidak dapat divalidasi/dihitung.';
    if (warning) warnings.push(`${variable.label}: ${warning}`);
    return { id: variable.id, label: variable.label, englishLabel: variable.englishLabel, value, rangeDescription: variable.rangeDescription ?? MISSING_VALUE_LABEL, category: categoryFor(value, rules), warning, isAutoDefault: Boolean(autoDefault || variable.autoRule) };
  });
  const availableValues = variableResults.map((item) => item.value).filter((value): value is number => value !== null);
  const total = availableValues.length === variableResults.length && variableResults.length > 0 ? availableValues.reduce((sum, value) => sum + value, 0) : null;
  return { variables: variableResults, total, category: categoryFor(total, rules), warnings, isAutoDefault: Boolean(autoDefault) };
};

export const calculateMentalCapacityIndex = (scores: ScoreRow[], config: SummaryAnalysisConfig): SummaryAnalysisResult['mentalCapacityIndex'] => calculateIndex(scores, config.mentalCapacityIndex?.variables, config.mentalCapacityIndex?.categoryRules, Boolean(config.isAutoDefault || config.mentalCapacityIndex?.isAutoDefault));

export const calculateBasicPersonalityIndex = (scores: ScoreRow[], config: SummaryAnalysisConfig): SummaryAnalysisResult['basicPersonalityIndex'] => calculateIndex(scores, config.basicPersonalityIndex?.variables, config.basicPersonalityIndex?.categoryRules, Boolean(config.isAutoDefault || config.basicPersonalityIndex?.isAutoDefault));

export const generateClinicalProfileSummary = (scores: ScoreRow[], config: SummaryAnalysisConfig): SummaryAnalysisResult['clinicalProfileSummary'] => {
  const warnings: string[] = [];
  if (!config.clinicalProfile?.narrativeRules?.length) return { narratives: [], redFlags: [], warnings: ['Profil klinis ringkas belum dapat dibuat karena konfigurasi analisa belum lengkap.'] };
  const narratives = config.clinicalProfile.narrativeRules.filter((rule) => {
    const sources = rule.sourceScales?.length ? rule.sourceScales : config.clinicalProfile?.sourceScales ?? [];
    const missing = sources.filter((source) => !hasScore(scores, source));
    if (missing.length === sources.length) {
      warnings.push(`${rule.domain ?? rule.condition ?? 'Profil klinis'}: ${MISSING_VALUE_LABEL}`);
      return false;
    }
    if (rule.formula && sources.length) return evaluateFormula(rule.formula, scores, sources) !== null;
    return sources.some((source) => {
      const score = findScore(scores, source);
      const value = scaleValue(score);
      if (!Number.isFinite(value)) return false;
      if (rule.condition === 'domain_elevated') return (score?.tScore ?? value ?? 0) >= 65;
      if (rule.minTScore !== undefined || rule.maxTScore !== undefined) {
        const t = score?.tScore;
        return Number.isFinite(t) && t! >= (rule.minTScore ?? -Infinity) && t! <= (rule.maxTScore ?? Infinity);
      }
      return value! >= (rule.minRaw ?? -Infinity) && value! <= (rule.maxRaw ?? Infinity);
    });
  }).map((rule) => rule.text);
  return { narratives: narratives.length ? narratives : [config.clinicalProfile.noElevationText ?? 'Tidak terdapat indikasi klinis menonjol berdasarkan konfigurasi yang tersedia.'], redFlags: narratives.filter((text) => /risiko|red flag|bahaya/i.test(text)), warnings };
};

export const generateSummaryConclusion = (summaryAnalysis: SummaryAnalysisResult, rhSummary?: RHSummary, specialistReview?: SpecialistReview): SummaryAnalysisResult['conclusionAndSuggestion'] => {
  const invalid = summaryAnalysis.testAttitude.score === 0;
  const caution = summaryAnalysis.testAttitude.score === 1 || Boolean(rhSummary?.needsSpecialistReview);
  const templates = summaryAnalysis.config?.conclusionTemplates;
  const suggestions = summaryAnalysis.config?.suggestionTemplates;
  const conclusion = invalid ? templates?.invalid : caution ? templates?.caution : templates?.valid;
  const suggestion = rhSummary?.needsSpecialistReview ? suggestions?.rh_redflag : summaryAnalysis.clinicalProfileSummary.redFlags.length ? suggestions?.high_elevation : summaryAnalysis.clinicalProfileSummary.narratives.length > 1 ? suggestions?.moderate_elevation : suggestions?.no_elevation;
  const reviewText = specialistReview?.finalConclusion ? ' Catatan spesialis tersedia dan harus diprioritaskan dalam keputusan akhir.' : '';
  return {
    conclusion: `${conclusion ?? 'Berdasarkan skor validitas, indeks kapasitas mental, indeks kepribadian dasar, dan profil klinis, hasil ini dapat ditelaah lebih lanjut oleh pemeriksa berwenang.'}${reviewText}`,
    suggestion: `${suggestion ?? ''} ${summaryAnalysis.isAutoDefault ? AUTO_DEFAULT_DISCLAIMER : 'Kesimpulan akhir harus ditetapkan oleh dokter jiwa/psikolog klinis/pemeriksa berwenang.'}`.trim(),
  };
};

export const buildSummaryAnalysis = (result: Pick<AssessmentResult, 'scores' | 'validityStatus' | 'rhSummary' | 'specialistReview'>, config = loadSummaryAnalysisConfig()): SummaryAnalysisResult => {
  if (!config) return { available: false, isDemo: false, isAutoDefault: false, message: 'Analisa Ringkas TNI AU belum tersedia. Admin perlu mengimpor konfigurasi analisa.', testAttitude: { score: null, label: MISSING_VALUE_LABEL, narrative: MISSING_VALUE_LABEL }, mentalCapacityIndex: { variables: [], total: null, category: MISSING_VALUE_LABEL }, clinicalProfileSummary: { narratives: [], redFlags: [] }, basicPersonalityIndex: { variables: [], total: null, category: MISSING_VALUE_LABEL }, conclusionAndSuggestion: { conclusion: MISSING_VALUE_LABEL, suggestion: 'Admin perlu mengimpor konfigurasi analisa.' } };
  const validation = validateSummaryAnalysisConfig(config);
  const analysis: SummaryAnalysisResult = {
    available: true,
    isDemo: Boolean(config.isDemo),
    isAutoDefault: Boolean(config.isAutoDefault),
    config,
    badgeLabel: config.isAutoDefault ? AUTO_DEFAULT_REPORT_BADGE_LABEL : undefined,
    disclaimer: config.isAutoDefault ? AUTO_DEFAULT_DISCLAIMER : config.disclaimer,
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

export const exportSummaryAnalysisConfig = (config = loadSummaryAnalysisConfig()) => {
  if (!config) return;
  return downloadFile('summaryAnalysisConfig-export.json', JSON.stringify(config, null, 2));
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
