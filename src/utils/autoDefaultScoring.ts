import type { Question, ScaleConfig, ScoringConfig } from '../types';
import { REQUIRED_TOTAL_QUESTIONS } from './answerFormat';
import { ADMIN_STORAGE_KEYS, readAdminJson, writeAdminJson } from './adminStorage';
import { normalizeScoringConfigResponses } from './answerFormat';
import { writeAuditLog } from './auditLog';

export const AUTO_DEFAULT_SCORING_VERSION = 'auto-default-v1';
export const AUTO_DEFAULT_LABEL = 'Auto-default scoring — bukan scoring resmi';
export const AUTO_DEFAULT_REPORT_BADGE = 'Scoring auto-default — perlu verifikasi admin/spesialis';
export const AUTO_DEFAULT_WARNING = 'Scoring menggunakan auto-default dan bukan scoring resmi.';
export const AUTO_DEFAULT_REPORT_DISCLAIMER = 'Hasil ini dihitung menggunakan konfigurasi scoring auto-default untuk kebutuhan teknis aplikasi. Tidak boleh digunakan sebagai dasar diagnosis, seleksi personel, keputusan klinis, atau laporan resmi sebelum diganti dengan scoringConfig resmi/berizin.';

export interface AutoDefaultValidationStatus {
  structurallyValid: boolean;
  readyForTechnicalScoring: boolean;
  readyForClinicalUse: boolean;
  status: 'auto_default_available' | 'official_available' | 'custom_available' | 'missing' | 'invalid';
  message: string;
  errors?: string[];
  warnings?: string[];
}

const SCALE_DEFINITIONS = [
  ['L', 'L', 'Lie (Auto-default)', 'validity', 22], ['F', 'F', 'Infrequency (Auto-default)', 'validity', 32], ['K', 'K', 'Correction (Auto-default)', 'validity', 30], ['VRIN', 'VRIN', 'Variable Response Inconsistency (Auto-default)', 'validity', 28], ['TRIN', 'TRIN', 'True Response Inconsistency (Auto-default)', 'validity', 28], ['Fb', 'Fb', 'Back F (Auto-default)', 'validity', 28], ['Fp', 'Fp', 'Infrequency-Psychopathology (Auto-default)', 'validity', 24], ['FBS', 'FBS', 'Symptom Validity (Auto-default)', 'validity', 30], ['S', 'S', 'Superlative Self-Presentation (Auto-default)', 'validity', 30],
  ['Hs', '1', 'Hypochondriasis / Hs (Auto-default)', 'clinical', 32], ['D', '2', 'Depression / D (Auto-default)', 'clinical', 48], ['Hy', '3', 'Hysteria / Hy (Auto-default)', 'clinical', 40], ['Pd', '4', 'Psychopathic Deviate / Pd (Auto-default)', 'clinical', 46], ['Mf', '5', 'Masculinity-Femininity / Mf (Auto-default)', 'clinical', 44], ['Pa', '6', 'Paranoia / Pa (Auto-default)', 'clinical', 40], ['Pt', '7', 'Psychasthenia / Pt (Auto-default)', 'clinical', 48], ['Sc', '8', 'Schizophrenia / Sc (Auto-default)', 'clinical', 50], ['Ma', '9', 'Hypomania / Ma (Auto-default)', 'clinical', 42], ['Si', '0', 'Social Introversion / Si (Auto-default)', 'clinical', 50],
  ['RCd', 'RCd', 'Demoralization (Auto-default)', 'rc', 28], ['RC1', 'RC1', 'Somatic Complaints (Auto-default)', 'rc', 28], ['RC2', 'RC2', 'Low Positive Emotions (Auto-default)', 'rc', 28], ['RC3', 'RC3', 'Cynicism (Auto-default)', 'rc', 28], ['RC4', 'RC4', 'Antisocial Behavior (Auto-default)', 'rc', 28], ['RC6', 'RC6', 'Ideas of Persecution (Auto-default)', 'rc', 28], ['RC7', 'RC7', 'Dysfunctional Negative Emotions (Auto-default)', 'rc', 28], ['RC8', 'RC8', 'Aberrant Experiences (Auto-default)', 'rc', 28], ['RC9', 'RC9', 'Hypomanic Activation (Auto-default)', 'rc', 28],
  ['ANX', 'ANX', 'Anxiety (Auto-default)', 'content', 24], ['DEP', 'DEP', 'Depression Content (Auto-default)', 'content', 24], ['HEA', 'HEA', 'Health Concerns (Auto-default)', 'content', 24], ['BIZ', 'BIZ', 'Bizarre Mentation (Auto-default)', 'content', 24], ['ANG', 'ANG', 'Anger (Auto-default)', 'content', 24], ['CYN', 'CYN', 'Cynicism Content (Auto-default)', 'content', 24],
  ['A', 'A', 'Anxiety Supplementary (Auto-default)', 'supplementary', 24], ['R', 'R', 'Repression (Auto-default)', 'supplementary', 24], ['Es', 'Es', 'Ego Strength (Auto-default)', 'supplementary', 24], ['MAC-R', 'MAC-R', 'MacAndrew Alcoholism-Revised (Auto-default)', 'supplementary', 24], ['PK', 'PK', 'Post-traumatic Stress (Auto-default)', 'supplementary', 24],
  ['AGGR', 'AGGR', 'Aggressiveness (Auto-default)', 'psy5', 26], ['PSYC', 'PSYC', 'Psychoticism (Auto-default)', 'psy5', 26], ['DISC', 'DISC', 'Disconstraint (Auto-default)', 'psy5', 26], ['NEGE', 'NEGE', 'Negative Emotionality/Neuroticism (Auto-default)', 'psy5', 26], ['INTR', 'INTR', 'Introversion/Low Positive Emotionality (Auto-default)', 'psy5', 26],
] as const;

const hashSeed = (scaleId: string) => Array.from(scaleId).reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 17), 0);
const questionOrderValue = (question: Question, index: number) => Number(question.number ?? question.order ?? question.id ?? index + 1);

export const generateDeterministicItemKeys = (scaleId: string, questions: Question[], itemCount: number) => {
  const pool = questions.slice(0, REQUIRED_TOTAL_QUESTIONS).map((question, index) => ({ question, index }));
  const seed = hashSeed(scaleId);
  return pool
    .map((entry) => ({ ...entry, sortKey: ((questionOrderValue(entry.question, entry.index) * 1103515245 + seed * 12345) >>> 0) }))
    .sort((a, b) => a.sortKey - b.sortKey || a.index - b.index)
    .slice(0, Math.min(itemCount, pool.length))
    .map(({ question, index }) => {
      const order = questionOrderValue(question, index);
      return { questionId: Number(question.id), scoredResponse: order % 2 === 1 ? '+' as const : '-' as const, point: 1, autoGenerated: true, officialKey: false };
    })
    .sort((a, b) => a.questionId - b.questionId);
};

export const generateAutoTScoreConversion = (maxRaw: number) => Array.from({ length: Math.max(0, maxRaw) + 1 }, (_, raw) => {
  const ratio = maxRaw > 0 ? raw / maxRaw : 0;
  const tScore = Math.round(35 + ratio * 50);
  return { raw, tScore, t: tScore, autoGenerated: true, officialNorm: false };
});

export const createAutoInterpretationRules = (scaleName: string) => [
  { min: 0, max: 49, label: 'rendah', description: `Skor ${scaleName} berada pada rentang rendah dalam konfigurasi auto-default.` },
  { min: 50, max: 59, label: 'dalam batas umum', description: `Skor ${scaleName} berada dalam rentang umum dalam konfigurasi auto-default.` },
  { min: 60, max: 64, label: 'area waspada', description: `Skor ${scaleName} berada pada area waspada dan perlu dikonfirmasi.` },
  { min: 65, max: 74, label: 'elevated', description: `Skor ${scaleName} menunjukkan elevasi teknis pada konfigurasi auto-default. Perlu review profesional.` },
  { min: 75, max: 120, label: 'high elevated', description: `Skor ${scaleName} menunjukkan elevasi tinggi pada konfigurasi auto-default. Tidak boleh dianggap diagnosis final.` },
];

export const createDefaultScale = (scaleId: string, code: string, name: string, group: string, questions: Question[], itemCount = 24): ScaleConfig => {
  const items = generateDeterministicItemKeys(scaleId, questions, itemCount);
  return {
    id: scaleId,
    code,
    name,
    group,
    type: group,
    description: `${AUTO_DEFAULT_LABEL}. Mapping dummy deterministik, bukan kunci scoring MMPI resmi.`,
    items,
    tScoreConversion: generateAutoTScoreConversion(items.length),
    interpretationRules: createAutoInterpretationRules(name),
    autoGenerated: true,
    officialKey: false,
  } as ScaleConfig;
};

export const createAutoDefaultScoringConfig = (questions: Question[]): ScoringConfig => normalizeScoringConfigResponses({
  instrument: 'MMPI',
  instrumentName: 'MMPI',
  version: AUTO_DEFAULT_SCORING_VERSION,
  configName: 'Auto-default ScoringConfig - Bukan Scoring Resmi',
  source: 'system-generated',
  isDemo: false,
  isAutoDefault: true,
  isOfficial: false,
  isFinal: false,
  licenseStatus: 'auto_default_not_official',
  totalItems: REQUIRED_TOTAL_QUESTIONS,
  answerFormat: 'plus_minus',
  allowedResponses: ['+', '-'],
  normType: 'auto_default_tscore',
  normSource: 'Auto-default synthetic conversion, not official norm',
  createdAt: new Date().toISOString(),
  label: AUTO_DEFAULT_LABEL,
  disclaimer: 'Konfigurasi scoring ini dibuat otomatis untuk kebutuhan teknis aplikasi. Bukan kunci scoring MMPI resmi dan tidak boleh digunakan sebagai dasar diagnosis, seleksi personel, atau keputusan klinis final.',
  validityRules: { minimumAnsweredItems: REQUIRED_TOTAL_QUESTIONS, allowInterpretationIfInvalid: false },
  tScoreRules: { lowMax: 49, normalMin: 50, normalMax: 59, borderlineMin: 60, borderlineMax: 64, elevatedMin: 65, elevatedMax: 74, markedlyElevatedMin: 75 },
  scales: SCALE_DEFINITIONS.map(([scaleId, code, name, group, itemCount]) => createDefaultScale(scaleId, code, name, group, questions, itemCount)),
  codeTypeRules: [],
} as unknown as ScoringConfig);

export const isAutoDefaultScoring = (config?: ScoringConfig | null) => Boolean(config?.isAutoDefault === true || config?.version === AUTO_DEFAULT_SCORING_VERSION || config?.licenseStatus === 'auto_default_not_official');

export const validateScoringConfig = (config: ScoringConfig | null, questions: Question[] = []): AutoDefaultValidationStatus => {
  if (!config) return { structurallyValid: false, readyForTechnicalScoring: false, readyForClinicalUse: false, status: 'missing', message: 'ScoringConfig belum tersedia.', errors: ['ScoringConfig belum tersedia.'] };
  const errors: string[] = [];
  if (!Array.isArray(config.scales) || !config.scales.length) errors.push('ScoringConfig wajib memiliki scales.');
  const questionIds = new Set(questions.map((question) => question.id));
  config.scales?.forEach((scale) => {
    if (!scale.id || !scale.name || !scale.group || !Array.isArray(scale.items) || !scale.items.length) errors.push(`Skala ${scale.id || '(tanpa id)'} tidak lengkap.`);
    if (questions.length && scale.items?.some((item) => !questionIds.has(Number(item.questionId)))) errors.push(`Skala ${scale.id} memiliki item yang tidak ada di bank soal.`);
  });
  if (errors.length) return { structurallyValid: false, readyForTechnicalScoring: false, readyForClinicalUse: false, status: 'invalid', message: errors[0], errors };
  if (isAutoDefaultScoring(config)) return { structurallyValid: true, readyForTechnicalScoring: true, readyForClinicalUse: false, status: 'auto_default_available', message: 'ScoringConfig auto-default tersedia untuk scoring teknis. Bukan scoring resmi.', warnings: ['Bukan scoring resmi, perlu diganti/verifikasi untuk laporan final.'] };
  const official = config.isOfficial === true;
  return { structurallyValid: true, readyForTechnicalScoring: true, readyForClinicalUse: official, status: official ? 'official_available' : 'custom_available', message: official ? 'ScoringConfig resmi/berizin tersedia.' : 'ScoringConfig custom tersedia untuk scoring teknis; perlu verifikasi admin/spesialis.' };
};

export const saveValidationStatus = (status: AutoDefaultValidationStatus) => {
  if (typeof window !== 'undefined') writeAdminJson(ADMIN_STORAGE_KEYS.configValidationStatus, status);
};

export const ensureScoringConfigExists = (questions: Question[], options: { force?: boolean } = {}) => {
  const current = readAdminJson<ScoringConfig | null>(ADMIN_STORAGE_KEYS.scoringConfig, null);
  if (current && !options.force) {
    const normalized = normalizeScoringConfigResponses(current);
    const status = validateScoringConfig(normalized, questions);
    saveValidationStatus(status);
    return { config: normalized, created: false, status };
  }
  const config = createAutoDefaultScoringConfig(questions);
  writeAdminJson(ADMIN_STORAGE_KEYS.scoringConfig, config);
  const status = validateScoringConfig(config, questions);
  saveValidationStatus(status);
  writeAuditLog({ action: options.force ? 'Buat ulang auto-default scoring' : 'Auto-generate scoring config', targetType: 'config', targetId: 'scoringConfig', description: 'ScoringConfig auto-default dibuat untuk scoring teknis. Bukan scoring resmi.' });
  return { config, created: true, status };
};

export const initializeAutoDefaultScoringConfig = (questions: Question[]) => ensureScoringConfigExists(questions);
export const restoreAutoDefaultScoringConfig = (questions: Question[]) => ensureScoringConfigExists(questions, { force: true });

export const replaceWithOfficialScoringConfig = (config: ScoringConfig) => {
  const officialConfig = normalizeScoringConfigResponses({ ...config, isAutoDefault: false, isOfficial: config.isOfficial === true, replacedAutoDefaultAt: new Date().toISOString() } as ScoringConfig);
  writeAdminJson(ADMIN_STORAGE_KEYS.scoringConfig, officialConfig);
  saveValidationStatus(validateScoringConfig(officialConfig));
  writeAuditLog({ action: 'Ganti scoring config', targetType: 'config', targetId: 'scoringConfig', description: officialConfig.isOfficial ? 'ScoringConfig resmi/berizin diimpor admin.' : 'ScoringConfig custom diimpor admin; verifikasi resmi belum ditandai.' });
  return officialConfig;
};
