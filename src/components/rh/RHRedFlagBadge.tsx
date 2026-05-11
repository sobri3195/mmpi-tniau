import type { RHForm } from '../../types';
import { Badge } from '../ui';
import { getRHRiskFlags, getRHSummary } from '../../utils/rhRedFlags';

export const RHRedFlagBadge = ({ form }: { form?: RHForm | null }) => {
  if (!form) return <Badge tone="amber">RH belum tersedia</Badge>;
  const flags = getRHRiskFlags(form);
  const summary = getRHSummary(form);
  if (summary.needsSpecialistReview) return <div className="flex flex-wrap gap-2"><Badge tone="amber">Ada Catatan RH</Badge><Badge tone="rose">Perlu Telaah Spesialis</Badge><span className="text-xs text-slate-500">{flags.length} catatan</span></div>;
  return <Badge tone="teal">Tidak Ada Red Flag RH</Badge>;
};
