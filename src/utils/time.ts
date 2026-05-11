export interface AssessmentTiming {
  startedAt: string;
  startedDate: string;
  startedTime: string;
  submittedAt?: string;
  submittedDate?: string;
  submittedTime?: string;
  durationSeconds?: number;
  durationText?: string;
}

const pad = (value: number) => String(value).padStart(2, '0');

export const dateParts = (date: Date) => ({
  date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
  time: `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
});

export const buildStartTiming = (date = new Date()): AssessmentTiming => {
  const parts = dateParts(date);
  return {
    startedAt: date.toISOString(),
    startedDate: parts.date,
    startedTime: parts.time,
    durationSeconds: 0,
    durationText: '0 jam 0 menit 0 detik',
  };
};

export const formatDurationText = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${hours} jam ${minutes} menit ${remainingSeconds} detik`;
};

export const buildSubmitTiming = (startedAt?: string, submittedDate = new Date()) => {
  const submittedParts = dateParts(submittedDate);
  const startedMs = startedAt ? new Date(startedAt).getTime() : Number.NaN;
  const durationSeconds = Number.isFinite(startedMs) ? Math.max(0, Math.floor((submittedDate.getTime() - startedMs) / 1000)) : 0;
  return {
    submittedAt: submittedDate.toISOString(),
    submittedDate: submittedParts.date,
    submittedTime: submittedParts.time,
    durationSeconds,
    durationText: formatDurationText(durationSeconds),
  };
};

export const formatDisplayDate = (value?: string) => value ? new Date(`${value}T00:00:00`).toLocaleDateString('id-ID') : '-';
