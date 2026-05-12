export interface BirthDateValidationResult {
  valid: boolean;
  birthDateISO?: string;
  age?: number;
  error?: string;
}

const DD_MM_YYYY = /^(\d{2})-(\d{2})-(\d{4})$/;

export const parseBirthDateInput = (input: string): Date | null => {
  const match = DD_MM_YYYY.exec(input.trim());
  if (!match) return null;
  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const monthIndex = Number(monthText) - 1;
  const year = Number(yearText);
  const date = new Date(Date.UTC(year, monthIndex, day));
  const isSameDate = date.getUTCFullYear() === year && date.getUTCMonth() === monthIndex && date.getUTCDate() === day;
  return isSameDate ? date : null;
};

export const toISODate = (date: Date) => date.toISOString().slice(0, 10);

export const calculateAge = (birthDate: Date, referenceDate = new Date()) => {
  let age = referenceDate.getUTCFullYear() - birthDate.getUTCFullYear();
  const hasBirthdayPassed = referenceDate.getUTCMonth() > birthDate.getUTCMonth()
    || (referenceDate.getUTCMonth() === birthDate.getUTCMonth() && referenceDate.getUTCDate() >= birthDate.getUTCDate());
  if (!hasBirthdayPassed) age -= 1;
  return age;
};

export const validateBirthDateInput = (input: string, referenceDate = new Date()): BirthDateValidationResult => {
  const birthDate = parseBirthDateInput(input);
  if (!birthDate) return { valid: false, error: 'Tanggal lahir wajib berformat DD-MM-YYYY dan merupakan tanggal kalender yang valid.' };
  if (birthDate.getTime() > referenceDate.getTime()) return { valid: false, error: 'Tanggal lahir tidak boleh berada di masa depan.' };
  return { valid: true, birthDateISO: toISODate(birthDate), age: calculateAge(birthDate, referenceDate) };
};
