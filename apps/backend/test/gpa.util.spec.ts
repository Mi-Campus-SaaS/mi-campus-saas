/* eslint-disable prettier/prettier */
import { calculateGpaFromGrades } from '../src/utils/gpa.util';

describe('calculateGpaFromGrades', () => {
  it('returns 0 for empty', () => {
    expect(calculateGpaFromGrades([])).toBe(0);
  });
  it('calculates average GPA', () => {
    const gpa = calculateGpaFromGrades([
      { score: 80, maxScore: 100 },
      { score: 90, maxScore: 100 },
    ]);
    expect(gpa).toBeCloseTo(3.4, 1);
  });
});
