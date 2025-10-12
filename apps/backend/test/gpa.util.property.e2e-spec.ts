import { calculateGpaFromGrades } from '../src/utils/gpa.util';
import * as fc from 'fast-check';

describe('calculateGpaFromGrades - Property-based tests', () => {
  describe('invariants', () => {
    it('GPA should be between 0 and 4 for normal cases (scores <= maxScores)', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc
              .record({
                score: fc.float({ min: 0, max: 100, noNaN: true }),
                maxScore: fc.float({ min: 1, max: 100, noNaN: true }),
              })
              .filter((g: { score: number; maxScore: number }) => g.score <= g.maxScore),
            { minLength: 1, maxLength: 50 },
          ),
          (grades: Array<{ score: number; maxScore: number }>) => {
            const gpa = calculateGpaFromGrades(grades);
            return gpa >= 0 && gpa <= 4;
          },
        ),
        { numRuns: 1000 },
      );
    });

    it('GPA should be 0 for empty grades array', () => {
      expect(calculateGpaFromGrades([])).toBe(0);
    });

    it('GPA should be deterministic (same input produces same output)', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              score: fc.float({ min: 0, max: 100, noNaN: true }),
              maxScore: fc.float({ min: 1, max: 100, noNaN: true }),
            }),
            { minLength: 1, maxLength: 20 },
          ),
          (grades: Array<{ score: number; maxScore: number }>) => {
            const gpa1 = calculateGpaFromGrades(grades);
            const gpa2 = calculateGpaFromGrades(grades);
            return gpa1 === gpa2;
          },
        ),
        { numRuns: 500 },
      );
    });

    it('GPA calculation should be independent of array order (commutative)', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              score: fc.float({ min: 0, max: 100, noNaN: true }),
              maxScore: fc.float({ min: 1, max: 100, noNaN: true }),
            }),
            { minLength: 2, maxLength: 20 },
          ),
          (grades: Array<{ score: number; maxScore: number }>) => {
            const originalGpa = calculateGpaFromGrades(grades);
            const shuffled = [...grades].reverse();
            const shuffledGpa = calculateGpaFromGrades(shuffled);
            return Math.abs(originalGpa - shuffledGpa) < 0.0001;
          },
        ),
        { numRuns: 500 },
      );
    });

    it('perfect scores should yield GPA of 4.0', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              score: fc.constant(100),
              maxScore: fc.constant(100),
            }),
            { minLength: 1, maxLength: 20 },
          ),
          (grades: Array<{ score: number; maxScore: number }>) => {
            const gpa = calculateGpaFromGrades(grades);
            return gpa === 4;
          },
        ),
        { numRuns: 100 },
      );
    });

    it('zero scores should yield GPA of 0.0', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              score: fc.constant(0),
              maxScore: fc.float({ min: 1, max: 100, noNaN: true }),
            }),
            { minLength: 1, maxLength: 20 },
          ),
          (grades: Array<{ score: number; maxScore: number }>) => {
            const gpa = calculateGpaFromGrades(grades);
            return gpa === 0;
          },
        ),
        { numRuns: 100 },
      );
    });

    it('GPA should not be NaN or Infinity', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              score: fc.double({ min: 0, max: 1000, noNaN: true }),
              maxScore: fc.double({ min: 0.1, max: 1000, noNaN: true }),
            }),
            { minLength: 1, maxLength: 50 },
          ),
          (grades: Array<{ score: number; maxScore: number }>) => {
            const gpa = calculateGpaFromGrades(grades);
            return !isNaN(gpa) && isFinite(gpa);
          },
        ),
        { numRuns: 1000 },
      );
    });

    it('GPA with decimal scores should be rounded to 2 decimal places', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              score: fc.float({ min: 0, max: 100, noNaN: true }),
              maxScore: fc.float({ min: 1, max: 100, noNaN: true }),
            }),
            { minLength: 1, maxLength: 20 },
          ),
          (grades: Array<{ score: number; maxScore: number }>) => {
            const gpa = calculateGpaFromGrades(grades);
            const rounded = Math.round(gpa * 100) / 100;
            return gpa === rounded;
          },
        ),
        { numRuns: 500 },
      );
    });
  });

  describe('boundary conditions', () => {
    it('handles very small maxScore values', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc
              .record({
                score: fc.double({ min: 0, max: 0.01, noNaN: true }),
                maxScore: fc.double({ min: 0.001, max: 0.01, noNaN: true }),
              })
              .filter((g: { score: number; maxScore: number }) => g.score <= g.maxScore),
            { minLength: 1, maxLength: 10 },
          ),
          (grades: Array<{ score: number; maxScore: number }>) => {
            const gpa = calculateGpaFromGrades(grades);
            return gpa >= 0 && gpa <= 4 && !isNaN(gpa);
          },
        ),
        { numRuns: 500 },
      );
    });

    it('handles very large score values', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc
              .record({
                score: fc.double({ min: 0, max: 10000, noNaN: true }),
                maxScore: fc.double({ min: 1, max: 10000, noNaN: true }),
              })
              .filter((g: { score: number; maxScore: number }) => g.score <= g.maxScore),
            { minLength: 1, maxLength: 10 },
          ),
          (grades: Array<{ score: number; maxScore: number }>) => {
            const gpa = calculateGpaFromGrades(grades);
            return gpa >= 0 && gpa <= 4 && !isNaN(gpa);
          },
        ),
        { numRuns: 500 },
      );
    });

    it('handles mixed perfect and zero scores', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.oneof(
              fc.record({ score: fc.constant(0), maxScore: fc.constant(100) }),
              fc.record({ score: fc.constant(100), maxScore: fc.constant(100) }),
            ),
            { minLength: 2, maxLength: 20 },
          ),
          (grades: Array<{ score: number; maxScore: number }>) => {
            const gpa = calculateGpaFromGrades(grades);
            return gpa >= 0 && gpa <= 4 && !isNaN(gpa);
          },
        ),
        { numRuns: 500 },
      );
    });

    it('single grade should produce valid GPA', () => {
      fc.assert(
        fc.property(
          fc
            .record({
              score: fc.float({ min: 0, max: 100, noNaN: true }),
              maxScore: fc.float({ min: 1, max: 100, noNaN: true }),
            })
            .filter((g: { score: number; maxScore: number }) => g.score <= g.maxScore),
          (grade: { score: number; maxScore: number }) => {
            const gpa = calculateGpaFromGrades([grade]);
            const expectedRatio = grade.score / grade.maxScore;
            const expectedGpa = Math.round(expectedRatio * 4 * 100) / 100;
            return Math.abs(gpa - expectedGpa) < 0.0001;
          },
        ),
        { numRuns: 1000 },
      );
    });
  });

  describe('edge cases that exceed normal bounds', () => {
    it('handles scores exceeding maxScore (extra credit scenario)', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              score: fc.double({ min: 101, max: 120, noNaN: true }),
              maxScore: fc.constant(100),
            }),
            { minLength: 1, maxLength: 10 },
          ),
          (grades: Array<{ score: number; maxScore: number }>) => {
            const gpa = calculateGpaFromGrades(grades);
            return gpa > 4 && gpa <= 4.8 && !isNaN(gpa);
          },
        ),
        { numRuns: 500 },
      );
    });
  });
});
