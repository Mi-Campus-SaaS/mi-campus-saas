import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import * as fc from 'fast-check';
import { AddGradesDto } from '../src/grades/dto/add-grades.dto';

describe('Grades DTO Property-based tests', () => {
  describe('GradeItemDto (via AddGradesDto)', () => {
    describe('valid inputs', () => {
      it('accepts valid grade items', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.array(
              fc.record({
                studentId: fc.uuid(),
                assignmentName: fc.string({ minLength: 1, maxLength: 200 }),
                score: fc.double({ min: 0, max: 1000, noNaN: true }),
                maxScore: fc.double({ min: 1, max: 1000, noNaN: true }),
                date: fc
                  .date({ min: new Date('1970-01-01'), max: new Date('2099-12-31') })
                  .map((d) => d.toISOString().split('T')[0]),
              }),
              { minLength: 1, maxLength: 50 },
            ),
            async (grades) => {
              const dto = plainToInstance(AddGradesDto, { grades });
              const errors = await validate(dto, { whitelist: true });
              return errors.length === 0;
            },
          ),
          { numRuns: 500 },
        );
      });

      it('accepts scores equal to maxScore', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            fc.string({ minLength: 1, maxLength: 200 }),
            fc.double({ min: 1, max: 100, noNaN: true }),
            fc.date({ min: new Date('1970-01-01'), max: new Date('2099-12-31') }),
            async (studentId, assignmentName, maxScore, date) => {
              const dto = plainToInstance(AddGradesDto, {
                grades: [
                  {
                    studentId,
                    assignmentName,
                    score: maxScore,
                    maxScore,
                    date: date.toISOString().split('T')[0],
                  },
                ],
              });
              const errors = await validate(dto, { whitelist: true });
              return errors.length === 0;
            },
          ),
          { numRuns: 300 },
        );
      });

      it('accepts scores greater than maxScore (extra credit scenario)', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            fc.string({ minLength: 1, maxLength: 200 }),
            fc.double({ min: 1, max: 100, noNaN: true }),
            fc.date({ min: new Date('1970-01-01'), max: new Date('2099-12-31') }),
            async (studentId, assignmentName, maxScore, date) => {
              const extraCreditScore = maxScore * 1.2;
              const dto = plainToInstance(AddGradesDto, {
                grades: [
                  {
                    studentId,
                    assignmentName,
                    score: extraCreditScore,
                    maxScore,
                    date: date.toISOString().split('T')[0],
                  },
                ],
              });
              const errors = await validate(dto, { whitelist: true });
              return errors.length === 0;
            },
          ),
          { numRuns: 300 },
        );
      });

      it('accepts zero scores', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            fc.string({ minLength: 1, maxLength: 200 }),
            fc.double({ min: 1, max: 100, noNaN: true }),
            fc.date({ min: new Date('1970-01-01'), max: new Date('2099-12-31') }),
            async (studentId, assignmentName, maxScore, date) => {
              const dto = plainToInstance(AddGradesDto, {
                grades: [
                  {
                    studentId,
                    assignmentName,
                    score: 0,
                    maxScore,
                    date: date.toISOString().split('T')[0],
                  },
                ],
              });
              const errors = await validate(dto, { whitelist: true });
              return errors.length === 0;
            },
          ),
          { numRuns: 300 },
        );
      });

      it('accepts decimal scores', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            fc.string({ minLength: 1, maxLength: 200 }),
            fc.double({ min: 0.01, max: 100, noNaN: true }),
            fc.double({ min: 1, max: 100, noNaN: true }),
            fc.date({ min: new Date('1970-01-01'), max: new Date('2099-12-31') }),
            async (studentId, assignmentName, score, maxScore, date) => {
              const dto = plainToInstance(AddGradesDto, {
                grades: [
                  {
                    studentId,
                    assignmentName,
                    score,
                    maxScore,
                    date: date.toISOString().split('T')[0],
                  },
                ],
              });
              const errors = await validate(dto, { whitelist: true });
              return errors.length === 0;
            },
          ),
          { numRuns: 500 },
        );
      });

      it('accepts multiple grades in batch', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.array(
              fc.record({
                studentId: fc.uuid(),
                assignmentName: fc.string({ minLength: 1, maxLength: 200 }),
                score: fc.double({ min: 0, max: 100, noNaN: true }),
                maxScore: fc.double({ min: 1, max: 100, noNaN: true }),
                date: fc
                  .date({ min: new Date('1970-01-01'), max: new Date('2099-12-31') })
                  .map((d) => d.toISOString().split('T')[0]),
              }),
              { minLength: 1, maxLength: 100 },
            ),
            async (grades) => {
              const dto = plainToInstance(AddGradesDto, { grades });
              const errors = await validate(dto, { whitelist: true });
              return errors.length === 0;
            },
          ),
          { numRuns: 300 },
        );
      });
    });

    describe('boundary violations', () => {
      it('rejects negative scores', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            fc.string({ minLength: 1, maxLength: 200 }),
            fc.double({ max: -0.01, noNaN: true }),
            fc.double({ min: 1, max: 100, noNaN: true }),
            fc.date({ min: new Date('1970-01-01'), max: new Date('2099-12-31') }),
            async (studentId, assignmentName, score, maxScore, date) => {
              const dto = plainToInstance(AddGradesDto, {
                grades: [
                  {
                    studentId,
                    assignmentName,
                    score,
                    maxScore,
                    date: date.toISOString().split('T')[0],
                  },
                ],
              });
              const errors = await validate(dto, { whitelist: true });
              return errors.length > 0;
            },
          ),
          { numRuns: 300 },
        );
      });

      it('rejects zero or negative maxScore', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            fc.string({ minLength: 1, maxLength: 200 }),
            fc.double({ min: 0, max: 100, noNaN: true }),
            fc.double({ max: 0, noNaN: true }),
            fc.date({ min: new Date('1970-01-01'), max: new Date('2099-12-31') }),
            async (studentId, assignmentName, score, maxScore, date) => {
              const dto = plainToInstance(AddGradesDto, {
                grades: [
                  {
                    studentId,
                    assignmentName,
                    score,
                    maxScore,
                    date: date.toISOString().split('T')[0],
                  },
                ],
              });
              const errors = await validate(dto, { whitelist: true });
              return errors.length > 0;
            },
          ),
          { numRuns: 300 },
        );
      });

      it('rejects empty assignment names', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            fc.double({ min: 0, max: 100, noNaN: true }),
            fc.double({ min: 1, max: 100, noNaN: true }),
            fc.date({ min: new Date('1970-01-01'), max: new Date('2099-12-31') }),
            async (studentId, score, maxScore, date) => {
              const dto = plainToInstance(AddGradesDto, {
                grades: [
                  {
                    studentId,
                    assignmentName: '',
                    score,
                    maxScore,
                    date: date.toISOString().split('T')[0],
                  },
                ],
              });
              const errors = await validate(dto, { whitelist: true });
              return errors.length > 0;
            },
          ),
          { numRuns: 200 },
        );
      });

      it('rejects assignment names longer than 200 characters', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            fc.string({ minLength: 201, maxLength: 500 }),
            fc.double({ min: 0, max: 100, noNaN: true }),
            fc.double({ min: 1, max: 100, noNaN: true }),
            fc.date({ min: new Date('1970-01-01'), max: new Date('2099-12-31') }),
            async (studentId, assignmentName, score, maxScore, date) => {
              const dto = plainToInstance(AddGradesDto, {
                grades: [
                  {
                    studentId,
                    assignmentName,
                    score,
                    maxScore,
                    date: date.toISOString().split('T')[0],
                  },
                ],
              });
              const errors = await validate(dto, { whitelist: true });
              return errors.length > 0;
            },
          ),
          { numRuns: 200 },
        );
      });

      it('rejects invalid student UUID', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc
              .string({ minLength: 1, maxLength: 50 })
              .filter((s) => !s.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)),
            fc.string({ minLength: 1, maxLength: 200 }),
            fc.double({ min: 0, max: 100, noNaN: true }),
            fc.double({ min: 1, max: 100, noNaN: true }),
            fc.date({ min: new Date('1970-01-01'), max: new Date('2099-12-31') }),
            async (studentId, assignmentName, score, maxScore, date) => {
              const dto = plainToInstance(AddGradesDto, {
                grades: [
                  {
                    studentId,
                    assignmentName,
                    score,
                    maxScore,
                    date: date.toISOString().split('T')[0],
                  },
                ],
              });
              const errors = await validate(dto, { whitelist: true });
              return errors.length > 0;
            },
          ),
          { numRuns: 200 },
        );
      });

      it('rejects invalid date strings', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            fc.string({ minLength: 1, maxLength: 200 }),
            fc.double({ min: 0, max: 100, noNaN: true }),
            fc.double({ min: 1, max: 100, noNaN: true }),
            fc.string({ minLength: 1, maxLength: 20 }).filter((s) => isNaN(Date.parse(s))),
            async (studentId, assignmentName, score, maxScore, date) => {
              const dto = plainToInstance(AddGradesDto, {
                grades: [
                  {
                    studentId,
                    assignmentName,
                    score,
                    maxScore,
                    date,
                  },
                ],
              });
              const errors = await validate(dto, { whitelist: true });
              return errors.length > 0;
            },
          ),
          { numRuns: 200 },
        );
      });

      it('rejects empty grades array', async () => {
        const dto = plainToInstance(AddGradesDto, { grades: [] });
        const errors = await validate(dto, { whitelist: true });
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((e) => e.property === 'grades')).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('handles very small scores and maxScores', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            fc.string({ minLength: 1, maxLength: 200 }),
            fc.double({ min: 0, max: 1, noNaN: true }),
            fc.double({ min: 1, max: 10, noNaN: true }),
            fc.date({ min: new Date('1970-01-01'), max: new Date('2099-12-31') }),
            async (studentId, assignmentName, score, maxScore, date) => {
              const dto = plainToInstance(AddGradesDto, {
                grades: [
                  {
                    studentId,
                    assignmentName,
                    score,
                    maxScore,
                    date: date.toISOString().split('T')[0],
                  },
                ],
              });
              const errors = await validate(dto, { whitelist: true });
              return errors.length === 0;
            },
          ),
          { numRuns: 300 },
        );
      });

      it('handles very large scores and maxScores', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            fc.string({ minLength: 1, maxLength: 200 }),
            fc.double({ min: 0, max: 100000, noNaN: true }),
            fc.double({ min: 1, max: 100000, noNaN: true }),
            fc.date({ min: new Date('1970-01-01'), max: new Date('2099-12-31') }),
            async (studentId, assignmentName, score, maxScore, date) => {
              const dto = plainToInstance(AddGradesDto, {
                grades: [
                  {
                    studentId,
                    assignmentName,
                    score,
                    maxScore,
                    date: date.toISOString().split('T')[0],
                  },
                ],
              });
              const errors = await validate(dto, { whitelist: true });
              return errors.length === 0;
            },
          ),
          { numRuns: 300 },
        );
      });

      it('handles mixed valid and boundary scores in batch', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.array(
              fc.oneof(
                fc.record({
                  studentId: fc.uuid(),
                  assignmentName: fc.string({ minLength: 1, maxLength: 200 }),
                  score: fc.constant(0),
                  maxScore: fc.double({ min: 1, max: 100, noNaN: true }),
                  date: fc
                    .date({ min: new Date('1970-01-01'), max: new Date('2099-12-31') })
                    .map((d) => d.toISOString().split('T')[0]),
                }),
                fc.record({
                  studentId: fc.uuid(),
                  assignmentName: fc.string({ minLength: 1, maxLength: 200 }),
                  score: fc.double({ min: 0, max: 100, noNaN: true }),
                  maxScore: fc.double({ min: 1, max: 100, noNaN: true }),
                  date: fc
                    .date({ min: new Date('1970-01-01'), max: new Date('2099-12-31') })
                    .map((d) => d.toISOString().split('T')[0]),
                }),
              ),
              { minLength: 1, maxLength: 20 },
            ),
            async (grades) => {
              const dto = plainToInstance(AddGradesDto, { grades });
              const errors = await validate(dto, { whitelist: true });
              return errors.length === 0;
            },
          ),
          { numRuns: 300 },
        );
      });

      it('handles assignment names at boundary length (1 and 200 chars)', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            fc.constantFrom('X', 'A'.repeat(200)),
            fc.double({ min: 0, max: 100, noNaN: true }),
            fc.double({ min: 1, max: 100, noNaN: true }),
            fc.date({ min: new Date('1970-01-01'), max: new Date('2099-12-31') }),
            async (studentId, assignmentName, score, maxScore, date) => {
              const dto = plainToInstance(AddGradesDto, {
                grades: [
                  {
                    studentId,
                    assignmentName,
                    score,
                    maxScore,
                    date: date.toISOString().split('T')[0],
                  },
                ],
              });
              const errors = await validate(dto, { whitelist: true });
              return errors.length === 0;
            },
          ),
          { numRuns: 200 },
        );
      });

      it('handles dates across different years and formats', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            fc.string({ minLength: 1, maxLength: 200 }),
            fc.double({ min: 0, max: 100, noNaN: true }),
            fc.double({ min: 1, max: 100, noNaN: true }),
            fc.date({ min: new Date('1900-01-01'), max: new Date('2100-12-31') }),
            async (studentId, assignmentName, score, maxScore, date) => {
              const dto = plainToInstance(AddGradesDto, {
                grades: [
                  {
                    studentId,
                    assignmentName,
                    score,
                    maxScore,
                    date: date.toISOString().split('T')[0],
                  },
                ],
              });
              const errors = await validate(dto, { whitelist: true });
              return errors.length === 0;
            },
          ),
          { numRuns: 300 },
        );
      });
    });
  });
});
