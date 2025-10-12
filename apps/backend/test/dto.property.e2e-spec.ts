import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import * as fc from 'fast-check';
import { PaginationQueryDto } from '../src/common/dto/pagination.dto';
import { CreateFeeDto } from '../src/finance/dto/create-fee.dto';
import { RecordPaymentDto } from '../src/finance/dto/record-payment.dto';

describe('DTO Property-based tests', () => {
  describe('PaginationQueryDto', () => {
    describe('valid inputs', () => {
      it('accepts valid page numbers (1 to 10000)', async () => {
        await fc.assert(
          fc.asyncProperty(fc.integer({ min: 1, max: 10000 }), async (page) => {
            const dto = plainToInstance(PaginationQueryDto, { page });
            const errors = await validate(dto);
            return errors.length === 0;
          }),
          { numRuns: 500 },
        );
      });

      it('accepts valid limit values (1 to 100)', async () => {
        await fc.assert(
          fc.asyncProperty(fc.integer({ min: 1, max: 100 }), async (limit) => {
            const dto = plainToInstance(PaginationQueryDto, { limit });
            const errors = await validate(dto);
            return errors.length === 0;
          }),
          { numRuns: 500 },
        );
      });

      it('accepts valid sortDir values', async () => {
        await fc.assert(
          fc.asyncProperty(fc.constantFrom('asc', 'desc'), async (sortDir) => {
            const dto = plainToInstance(PaginationQueryDto, { sortDir });
            const errors = await validate(dto);
            return errors.length === 0;
          }),
          { numRuns: 100 },
        );
      });

      it('accepts optional string values for sortBy and q', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 0, maxLength: 100 }),
            fc.string({ minLength: 0, maxLength: 100 }),
            async (sortBy, q) => {
              const dto = plainToInstance(PaginationQueryDto, { sortBy, q });
              const errors = await validate(dto);
              return errors.length === 0;
            },
          ),
          { numRuns: 300 },
        );
      });

      it('accepts complete valid pagination params', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              page: fc.integer({ min: 1, max: 10000 }),
              limit: fc.integer({ min: 1, max: 100 }),
              sortBy: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
              sortDir: fc.constantFrom('asc', 'desc'),
              q: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
            }),
            async (params) => {
              const dto = plainToInstance(PaginationQueryDto, params);
              const errors = await validate(dto);
              return errors.length === 0;
            },
          ),
          { numRuns: 500 },
        );
      });
    });

    describe('boundary violations', () => {
      it('rejects page numbers less than 1', async () => {
        await fc.assert(
          fc.asyncProperty(fc.integer({ max: 0 }), async (page) => {
            const dto = plainToInstance(PaginationQueryDto, { page });
            const errors = await validate(dto);
            return errors.length > 0 && errors.some((e) => e.property === 'page');
          }),
          { numRuns: 200 },
        );
      });

      it('rejects limit values less than 1', async () => {
        await fc.assert(
          fc.asyncProperty(fc.integer({ max: 0 }), async (limit) => {
            const dto = plainToInstance(PaginationQueryDto, { limit });
            const errors = await validate(dto);
            return errors.length > 0 && errors.some((e) => e.property === 'limit');
          }),
          { numRuns: 200 },
        );
      });

      it('rejects limit values greater than 100', async () => {
        await fc.assert(
          fc.asyncProperty(fc.integer({ min: 101, max: 10000 }), async (limit) => {
            const dto = plainToInstance(PaginationQueryDto, { limit });
            const errors = await validate(dto);
            return errors.length > 0 && errors.some((e) => e.property === 'limit');
          }),
          { numRuns: 200 },
        );
      });

      it('rejects invalid sortDir values', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s !== 'asc' && s !== 'desc'),
            async (sortDir) => {
              const dto = plainToInstance(PaginationQueryDto, { sortDir });
              const errors = await validate(dto);
              return errors.length > 0 && errors.some((e) => e.property === 'sortDir');
            },
          ),
          { numRuns: 200 },
        );
      });

      it('rejects non-integer page values', async () => {
        await fc.assert(
          fc.asyncProperty(fc.double({ min: 1.1, max: 100.9, noNaN: true }), async (page) => {
            const dto = plainToInstance(PaginationQueryDto, { page });
            const errors = await validate(dto);
            return errors.length > 0 && errors.some((e) => e.property === 'page');
          }),
          { numRuns: 200 },
        );
      });
    });

    describe('default values', () => {
      it('applies default values when fields are undefined', async () => {
        const dto = plainToInstance(PaginationQueryDto, {});
        const errors = await validate(dto);

        expect(errors.length).toBe(0);
        expect(dto.page).toBe(1);
        expect(dto.limit).toBe(20);
        expect(dto.sortDir).toBe('desc');
      });
    });
  });

  describe('CreateFeeDto', () => {
    describe('valid inputs', () => {
      it('accepts valid positive amounts', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            fc.double({ min: 0.01, max: 1000000, noNaN: true }),
            fc.date({ min: new Date('1970-01-01'), max: new Date('2099-12-31') }),
            fc.constantFrom('pending', 'paid', 'overdue'),
            async (studentId, amount, dueDate, status) => {
              const dto = plainToInstance(CreateFeeDto, {
                studentId,
                amount,
                dueDate: dueDate.toISOString(),
                status,
              });
              const errors = await validate(dto);
              return errors.length === 0;
            },
          ),
          { numRuns: 500 },
        );
      });

      it('accepts very small positive amounts (cents)', async () => {
        await fc.assert(
          fc.asyncProperty(fc.uuid(), fc.double({ min: 0.01, max: 1, noNaN: true }), async (studentId, amount) => {
            const dto = plainToInstance(CreateFeeDto, {
              studentId,
              amount,
              dueDate: '2024-01-01',
              status: 'pending',
            });
            const errors = await validate(dto);
            return errors.length === 0;
          }),
          { numRuns: 300 },
        );
      });

      it('accepts very large amounts', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            fc.double({ min: 100000, max: 999999999, noNaN: true }),
            async (studentId, amount) => {
              const dto = plainToInstance(CreateFeeDto, {
                studentId,
                amount,
                dueDate: '2024-01-01',
                status: 'pending',
              });
              const errors = await validate(dto);
              return errors.length === 0;
            },
          ),
          { numRuns: 300 },
        );
      });
    });

    describe('boundary violations', () => {
      it('rejects zero or negative amounts', async () => {
        await fc.assert(
          fc.asyncProperty(fc.uuid(), fc.double({ max: 0, noNaN: true }), async (studentId, amount) => {
            const dto = plainToInstance(CreateFeeDto, {
              studentId,
              amount,
              dueDate: '2024-01-01',
              status: 'pending',
            });
            const errors = await validate(dto);
            return errors.length > 0 && errors.some((e) => e.property === 'amount');
          }),
          { numRuns: 300 },
        );
      });

      it('rejects invalid UUID formats', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc
              .string({ minLength: 1, maxLength: 50 })
              .filter((s) => !s.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)),
            async (studentId) => {
              const dto = plainToInstance(CreateFeeDto, {
                studentId,
                amount: 100,
                dueDate: '2024-01-01',
                status: 'pending',
              });
              const errors = await validate(dto);
              return errors.length > 0 && errors.some((e) => e.property === 'studentId');
            },
          ),
          { numRuns: 200 },
        );
      });

      it('rejects invalid date strings', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            fc.string({ minLength: 1, maxLength: 20 }).filter((s) => isNaN(Date.parse(s))),
            async (studentId, dueDate) => {
              const dto = plainToInstance(CreateFeeDto, {
                studentId,
                amount: 100,
                dueDate,
                status: 'pending',
              });
              const errors = await validate(dto);
              return errors.length > 0 && errors.some((e) => e.property === 'dueDate');
            },
          ),
          { numRuns: 200 },
        );
      });

      it('rejects invalid status values', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            fc.string({ minLength: 1, maxLength: 20 }).filter((s) => !['pending', 'paid', 'overdue'].includes(s)),
            async (studentId, status) => {
              const dto = plainToInstance(CreateFeeDto, {
                studentId,
                amount: 100,
                dueDate: '2024-01-01',
                status,
              });
              const errors = await validate(dto);
              return errors.length > 0 && errors.some((e) => e.property === 'status');
            },
          ),
          { numRuns: 200 },
        );
      });
    });
  });

  describe('RecordPaymentDto', () => {
    describe('valid inputs', () => {
      it('accepts valid payment amounts', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            fc.double({ min: 0.01, max: 1000000, noNaN: true }),
            fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
            async (invoiceId, amount, reference) => {
              const dto = plainToInstance(RecordPaymentDto, {
                invoiceId,
                amount,
                reference,
              });
              const errors = await validate(dto);
              return errors.length === 0;
            },
          ),
          { numRuns: 500 },
        );
      });

      it('accepts payments without reference', async () => {
        await fc.assert(
          fc.asyncProperty(fc.uuid(), fc.double({ min: 0.01, max: 1000, noNaN: true }), async (invoiceId, amount) => {
            const dto = plainToInstance(RecordPaymentDto, {
              invoiceId,
              amount,
            });
            const errors = await validate(dto);
            return errors.length === 0;
          }),
          { numRuns: 300 },
        );
      });
    });

    describe('boundary violations', () => {
      it('rejects zero or negative payment amounts', async () => {
        await fc.assert(
          fc.asyncProperty(fc.uuid(), fc.double({ max: 0, noNaN: true }), async (invoiceId, amount) => {
            const dto = plainToInstance(RecordPaymentDto, {
              invoiceId,
              amount,
            });
            const errors = await validate(dto);
            return errors.length > 0 && errors.some((e) => e.property === 'amount');
          }),
          { numRuns: 300 },
        );
      });

      it('rejects invalid invoice UUID', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc
              .string({ minLength: 1, maxLength: 50 })
              .filter((s) => !s.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)),
            async (invoiceId) => {
              const dto = plainToInstance(RecordPaymentDto, {
                invoiceId,
                amount: 100,
              });
              const errors = await validate(dto);
              return errors.length > 0 && errors.some((e) => e.property === 'invoiceId');
            },
          ),
          { numRuns: 200 },
        );
      });
    });

    describe('edge cases', () => {
      it('handles very small payments (micro-transactions)', async () => {
        await fc.assert(
          fc.asyncProperty(fc.uuid(), fc.double({ min: 0.01, max: 0.99, noNaN: true }), async (invoiceId, amount) => {
            const dto = plainToInstance(RecordPaymentDto, {
              invoiceId,
              amount,
            });
            const errors = await validate(dto);
            return errors.length === 0;
          }),
          { numRuns: 200 },
        );
      });

      it('handles very large payments', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            fc.double({ min: 1000000, max: 999999999, noNaN: true }),
            async (invoiceId, amount) => {
              const dto = plainToInstance(RecordPaymentDto, {
                invoiceId,
                amount,
              });
              const errors = await validate(dto);
              return errors.length === 0;
            },
          ),
          { numRuns: 200 },
        );
      });
    });
  });
});
