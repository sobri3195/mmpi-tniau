import type { Question } from '../types';

const parseBool = (value: string) => ['true', '1', 'ya', 'yes', 'benar'].includes(value.trim().toLowerCase());

const splitCsvLine = (line: string) => {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') {
      cur += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += char;
    }
  }
  out.push(cur.trim());
  return out;
};

export const parseQuestionsCsv = (text: string): Question[] => {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (!lines.length) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, cols[index] ?? '']));
    const responseType = (row.responseType || 'true_false') as Question['responseType'];
    return {
      id: Number(row.id),
      code: row.code,
      text: row.text,
      responseType,
      required: row.required ? parseBool(row.required) : true,
      options: responseType === 'yes_no'
        ? [{ label: 'Ya', value: true }, { label: 'Tidak', value: false }]
        : [{ label: 'True', value: true }, { label: 'False', value: false }],
    };
  });
};
