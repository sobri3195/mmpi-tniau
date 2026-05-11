import { Card } from '../ui';
import type { SpecialistReview } from '../../types';

export const FinalReportSignature = ({ review }: { review: SpecialistReview }) => (
  <Card className="border-teal-200 bg-teal-50/60 dark:border-teal-900 dark:bg-teal-950/30">
    <p className="text-sm font-bold uppercase tracking-wide text-teal-700">Signature Panel</p>
    <h3 className="mt-2 text-xl font-black">Tanda tangan laporan final</h3>
    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><p><strong>Penelaah:</strong> {review.reviewerName || '-'}</p><p><strong>Jabatan:</strong> {review.reviewerTitle || '-'}</p><p><strong>Nomor izin:</strong> {review.licenseNumber || '-'}</p><p><strong>Ditelaah:</strong> {review.reviewedAt ? new Date(review.reviewedAt).toLocaleString('id-ID') : '-'}</p></div>
  </Card>
);
