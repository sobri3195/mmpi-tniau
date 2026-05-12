import type { Answers, ScoringConfig } from '../types';
import { calculateRawScores } from './scoring';

const scoringConfig: ScoringConfig = {
  instrumentName: 'Unit Test MMPI',
  version: 'test',
  scales: [
    {
      id: 'scale-a',
      code: 'A',
      name: 'Skala A',
      group: 'clinical',
      items: [
        { questionId: 1, scoredResponse: '+', point: 1 },
        { questionId: 2, scoredResponse: '-', point: 2 },
      ],
      tScoreConversion: [{ raw: 3, tScore: 60 }],
    },
  ],
};

describe('calculateRawScores', () => {
  it('menghitung jawaban + dan - sesuai konfigurasi dummy kecil', () => {
    const answers: Answers = { '1': '+', '2': '-' };

    const [score] = calculateRawScores(answers, scoringConfig);

    expect(score.rawScore).toBe(3);
    expect(score.tScore).toBe(60);
    expect(score.scaleId).toBe('scale-a');
  });

  it('aman saat scoringConfig kosong dan mengembalikan daftar skor kosong', () => {
    expect(calculateRawScores({}, { instrumentName: 'Empty', version: 'test', scales: [] })).toEqual([]);
  });
});
