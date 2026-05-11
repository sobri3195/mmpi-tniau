import type { AssessmentResult } from '../types';

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

export const resultToCsv = (results: AssessmentResult[]) => {
  const rows = [['id', 'nama', 'nomor_peserta', 'usia', 'gender', 'unit', 'tanggal_submit', 'status', 'skor']];
  results.forEach((result) => rows.push([
    result.id,
    result.identity.name,
    result.identity.participantNumber ?? '',
    result.identity.age,
    result.identity.gender,
    result.identity.unit,
    result.submittedAt,
    result.status,
    result.scores.map((score) => `${score.scaleId}:${score.rawScore}${score.tScore ? `/T${score.tScore}` : ''}`).join('; '),
  ]));
  return rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
};

export const exportResultJson = (result: AssessmentResult) => downloadFile(`hasil-${result.identity.name || result.id}.json`, JSON.stringify(result, null, 2));
export const exportResultsJson = (results: AssessmentResult[]) => downloadFile('hasil-asesmen-sppg.json', JSON.stringify(results, null, 2));
export const exportResultsCsv = (results: AssessmentResult[]) => downloadFile('hasil-asesmen-sppg.csv', resultToCsv(results), 'text/csv;charset=utf-8');
export const printReport = () => window.print();
