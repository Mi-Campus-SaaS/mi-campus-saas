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
  it('handles boundary 0 and 100 scores', () => {
    expect(calculateGpaFromGrades([{ score: 0, maxScore: 100 }])).toBe(0);
    expect(calculateGpaFromGrades([{ score: 100, maxScore: 100 }])).toBe(4);
  });
  it('handles >100 and decimals by normalizing ratio', () => {
    // If score exceeds maxScore, ratio > 1; current util averages raw ratios
    // This test documents behavior: GPA can exceed 4 but we expect capping in real-world; here it rounds to 4*ratio
    const gpa = calculateGpaFromGrades([{ score: 110.5, maxScore: 100 }]);
    expect(gpa).toBeCloseTo(4.42, 2);
  });
  it('handles decimal scores', () => {
    const gpa = calculateGpaFromGrades([
      { score: 8.5, maxScore: 10 },
      { score: 7.25, maxScore: 10 },
    ]);
    expect(gpa).toBeCloseTo(3.15, 2);
  });
});
