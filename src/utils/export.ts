import type { AssessmentResult } from '../types';
import { normalizeResultAnswers } from './answerFormat';

export const downloadFile = (filename: string, content: string, mime = 'application/json') => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const escapeCsv = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
const timeFromIso = (value?: string) => value ? new Date(value).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : '';
const dateFromIso = (value?: string) => value ? value.slice(0, 10) : '';

export const resultToCsv = (results: AssessmentResult[]) => {
  const normalizedResults = results.map(normalizeResultAnswers);
  const answerKeys = Array.from(new Set(normalizedResults.flatMap((result) => Object.keys(result.answers)))).sort((a, b) => Number(a) - Number(b));
  const rows: unknown[][] = [[
    'id', 'nama', 'nomor_peserta', 'tanggal_lahir', 'birthDateInput', 'birthDateISO', 'age', 'gender', 'status_perkawinan', 'pendidikan', 'pekerjaan', 'asal_satker', 'kesatuan',
    'tanggal_asesmen', 'startedDate', 'startedTime', 'submittedDate', 'submittedTime', 'durationSeconds', 'durationText', 'total_soal', 'total_dijawab', 'status_pengerjaan', 'status_validitas', 'skor',
    ...answerKeys.map((key) => `answer_${key.padStart(3, '0')}`),
  ]];
  normalizedResults.forEach((result) => rows.push([
    result.id,
    result.identity.name,
    result.identity.participantNumber ?? '',
    result.identity.birthDateInput || result.identity.dateOfBirth || '',
    result.identity.birthDateInput ?? '',
    result.identity.birthDateISO ?? result.identity.dateOfBirth ?? '',
    result.identity.age,
    result.identity.gender,
    result.identity.maritalStatus ?? '',
    result.identity.education ?? '',
    result.identity.occupation ?? '',
    result.identity.originWorkUnit ?? '',
    result.identity.unit,
    result.identity.assessmentDate,
    result.startedDate ?? dateFromIso(result.startedAt),
    result.startedTime ?? timeFromIso(result.startedAt),
    result.submittedDate ?? dateFromIso(result.submittedAt),
    result.submittedTime ?? timeFromIso(result.submittedAt),
    result.durationSeconds ?? '',
    result.durationText ?? result.durationLabel ?? '',
    result.totalQuestions,
    result.answeredCount,
    result.status,
    result.validityStatus?.label ?? 'Unknown',
    result.scores.map((score) => `${score.scaleId}:${score.rawScore}${score.tScore ? `/T${score.tScore}` : ''}`).join('; '),
    ...answerKeys.map((key) => result.answers[key] ?? ''),
  ]));
  return rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
};

export const exportResultJson = (result: AssessmentResult) => downloadFile(`hasil-${result.identity.name || result.id}.json`, JSON.stringify(normalizeResultAnswers(result), null, 2));
export const exportResultsJson = (results: AssessmentResult[]) => downloadFile('hasil-asesmen-sppg.json', JSON.stringify(results.map(normalizeResultAnswers), null, 2));
export const exportResultsCsv = (results: AssessmentResult[]) => downloadFile('hasil-asesmen-sppg.csv', resultToCsv(results), 'text/csv;charset=utf-8');
export const printReport = () => window.print();
