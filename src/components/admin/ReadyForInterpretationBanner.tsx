import type { SystemReadinessStatus } from '../../utils/systemReadiness';
import { Button, Card } from '../ui';

export const ReadyForInterpretationBanner = ({ status, onOpenWizard }: { status: SystemReadinessStatus; onOpenWizard?: () => void }) => (
  <Card className={status.systemReadyForInterpretation ? 'border-teal-200 bg-teal-50 dark:border-teal-800 dark:bg-teal-950' : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950'}>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-xl font-black">{status.systemReadyForInterpretation ? 'Sistem Siap Interpretasi.' : 'Sistem belum siap interpretasi.'}</h2>
        <p className="mt-1 text-sm leading-6">{status.systemReadyForInterpretation ? 'Bank soal, scoring, norma T-score, interpretasi Rusdi Maslim, interpretasi Hubertus, RH Skrining, Analisa Ringkas TNI AU, dan template laporan telah tervalidasi.' : 'Lengkapi config resmi/berizin melalui Wizard Siap Interpretasi. Sistem tidak akan menampilkan interpretasi palsu.'}</p>
      </div>
      {onOpenWizard && <Button variant={status.systemReadyForInterpretation ? 'secondary' : 'primary'} onClick={onOpenWizard}>Wizard Siap Interpretasi</Button>}
    </div>
  </Card>
);
