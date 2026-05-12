import type { ClinicalFinalizationChecklist } from '../../types';

export const clinicalChecklistFields: Array<[keyof ClinicalFinalizationChecklist, string]> = [
  ['identityVerified', 'Identitas peserta sudah sesuai'],
  ['answersComplete', 'Jumlah jawaban MMPI lengkap'],
  ['durationReviewed', 'Jam mulai, selesai, dan durasi wajar'],
  ['validityReviewed', 'Skala validitas telah ditinjau'],
  ['redFlagsReviewed', 'Red flag RH sudah ditinjau'],
  ['rhCompared', 'RH Skrining dibandingkan dengan profil MMPI'],
  ['rusdiReviewed', 'Interpretasi Rusdi Maslim sudah dibaca'],
  ['hubertusReviewed', 'Interpretasi Hubertus sudah dibaca'],
  ['summaryAnalysisReviewed', 'Analisa Ringkas TNI AU ditinjau'],
  ['manualConclusionAdded', 'Kesimpulan tidak hanya otomatis dan rekomendasi profesional'],
  ['disclaimerIncluded', 'Disclaimer tercantum'],
];

export const defaultClinicalChecklist = (): ClinicalFinalizationChecklist => ({
  identityVerified: false,
  answersComplete: false,
  durationReviewed: false,
  validityReviewed: false,
  redFlagsReviewed: false,
  rhCompared: false,
  rusdiReviewed: false,
  hubertusReviewed: false,
  summaryAnalysisReviewed: false,
  manualConclusionAdded: false,
  disclaimerIncluded: false,
  completedBy: '',
  completedAt: '',
});

export const isClinicalChecklistComplete = (checklist?: Partial<ClinicalFinalizationChecklist>) =>
  clinicalChecklistFields.every(([key]) => Boolean(checklist?.[key]));
