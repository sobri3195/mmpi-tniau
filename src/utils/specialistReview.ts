import type { AssessmentResult, SpecialistReview } from '../types';
import { ADMIN_STORAGE_KEYS, readAdminJson, writeAdminJson } from './adminStorage';
import { getCurrentUser } from './session';
import { hasPermission } from './permissions';
import { writeAuditLog } from './auditLog';

const emptyReview = (): SpecialistReview => ({
  status: 'pending', reviewerId: '', reviewerName: '', reviewerTitle: '', licenseNumber: '', reviewedAt: '',
  validityNotes: '', clinicalImpression: '', riskNotes: '', recommendations: '', limitations: '', finalConclusion: '', isLocked: false,
});

const loadResults = () => readAdminJson<AssessmentResult[]>(ADMIN_STORAGE_KEYS.results, []);
const saveResults = (results: AssessmentResult[]) => writeAdminJson(ADMIN_STORAGE_KEYS.results, results);
const updateResultReview = (resultId: string, updater: (review: SpecialistReview, result: AssessmentResult) => SpecialistReview) => {
  const user = getCurrentUser();
  if (!hasPermission(user, 'review.update')) throw new Error('Tidak memiliki akses telaah.');
  let updated: AssessmentResult | null = null;
  const results = loadResults().map((result) => {
    if (result.id !== resultId) return result;
    const current = result.specialistReview ?? emptyReview();
    if (current.isLocked && user?.role !== 'superadmin') throw new Error('Laporan sudah dikunci. Hubungi Superadmin untuk membuka kunci.');
    const specialistReview = updater(current, result);
    updated = { ...result, specialistReview, status: specialistReview.status === 'finalized' ? 'Selesai' : 'Perlu Review' };
    return updated;
  });
  if (!updated) throw new Error('Hasil tidak ditemukan.');
  saveResults(results);
  return updated;
};

export const ensureSpecialistReview = (result: AssessmentResult): SpecialistReview => result.specialistReview ?? emptyReview();
export const createSpecialistReview = (resultId: string) => updateResultReview(resultId, (review) => ({ ...emptyReview(), ...review, status: review.status || 'pending' }));
export const updateSpecialistReview = (resultId: string, patch: Partial<SpecialistReview>) => {
  const updated = updateResultReview(resultId, (review) => ({ ...review, ...patch }));
  writeAuditLog({ action: 'Specialist reviewed result', targetType: 'result', targetId: resultId, description: 'Memperbarui catatan telaah spesialis.' });
  return updated;
};
export const finalizeSpecialistReview = (resultId: string, patch: Partial<SpecialistReview>) => {
  const user = getCurrentUser();
  if (!hasPermission(user, 'review.finalize')) throw new Error('Tidak memiliki akses finalisasi laporan.');
  const updated = updateResultReview(resultId, (review) => ({
    ...review, ...patch, status: 'finalized', reviewerId: user?.userId ?? '', reviewerName: user?.displayName ?? '',
    reviewerTitle: user?.signature.title ?? '', licenseNumber: user?.signature.licenseNumber ?? patch.licenseNumber ?? '',
    reviewedAt: new Date().toISOString(), isLocked: true,
  }));
  writeAuditLog({ action: 'Specialist finalized report', targetType: 'result', targetId: resultId, description: 'Finalisasi dan kunci laporan spesialis.' });
  return updated;
};
export const lockReport = (resultId: string) => updateSpecialistReview(resultId, { isLocked: true });
export const unlockReportBySuperadmin = (resultId: string) => {
  const user = getCurrentUser();
  if (user?.role !== 'superadmin') throw new Error('Hanya Superadmin yang dapat membuka kunci laporan.');
  const updated = updateResultReview(resultId, (review) => ({ ...review, isLocked: false }));
  writeAuditLog({ action: 'Unlock report', targetType: 'result', targetId: resultId, description: 'Superadmin membuka kunci laporan spesialis.' });
  return updated;
};
