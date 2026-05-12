import { calculateAge, parseBirthDateInput, toISODate, validateBirthDateInput } from './dateOfBirth';

describe('dateOfBirth utilities', () => {
  const referenceDate = new Date('2026-05-11T00:00:00.000Z');

  it('menerima input DD-MM-YYYY dan mengonversi ke ISO', () => {
    const parsed = parseBirthDateInput('17-08-1990');

    expect(parsed).not.toBeNull();
    expect(parsed ? toISODate(parsed) : '').toBe('1990-08-17');
  });

  it('menghitung usia berdasarkan tanggal referensi', () => {
    const parsed = parseBirthDateInput('10-05-2000');

    expect(parsed ? calculateAge(parsed, referenceDate) : undefined).toBe(26);
  });

  it('menolak tanggal masa depan', () => {
    expect(validateBirthDateInput('12-05-2026', referenceDate)).toMatchObject({ valid: false });
  });
});
