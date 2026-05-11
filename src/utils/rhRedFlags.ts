import type { RHForm, RHSummary } from '../types';

export const RED_FLAG_HEALTH_NUMBERS = [36, 37, 39, 41, 44, 45, 46, 47, 49, 50];
export const PSYCHIATRIC_HEALTH_NUMBERS = [39, 44, 45, 46, 47, 49];

export const getRHRiskFlags = (form: RHForm): string[] => {
  const flags = form.healthHistory.items
    .filter((item) => RED_FLAG_HEALTH_NUMBERS.includes(item.no) && item.answer === 'Ya')
    .map((item) => `${item.no}. ${item.complaint}`);
  if (form.socialHistory.substanceUseHistory === 'Ya') flags.push('Riwayat narkoba/zat adiktif');
  if (form.socialHistory.legalProblemHistory === 'Ya') flags.push('Riwayat masalah hukum');
  if (form.socialHistory.hasSeriousProblem === 'Ya' && form.socialHistory.receivedTreatmentForProblem === 'Ya') flags.push('Persoalan berat yang memerlukan berobat');
  return flags;
};

export const getRHSummary = (form: RHForm): RHSummary => {
  const flags = getRHRiskFlags(form);
  return {
    hasMedicalRedFlags: form.healthHistory.items.some((item) => [36, 37, 50].includes(item.no) && item.answer === 'Ya'),
    hasPsychiatricRedFlags: form.healthHistory.items.some((item) => PSYCHIATRIC_HEALTH_NUMBERS.includes(item.no) && item.answer === 'Ya'),
    hasSubstanceHistory: form.socialHistory.substanceUseHistory === 'Ya' || form.healthHistory.items.some((item) => item.no === 41 && item.answer === 'Ya'),
    hasLegalHistory: form.socialHistory.legalProblemHistory === 'Ya',
    needsSpecialistReview: flags.length > 0,
  };
};
