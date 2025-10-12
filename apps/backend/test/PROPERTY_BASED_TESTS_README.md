# Property-Based Testing Implementation

## Overview

Implemented property-based tests using **fast-check** library for:

- GPA utility functions
- DTO boundary validations

## Test Files Created

### 1. `gpa.util.property.e2e-spec.ts`

Property-based tests for the GPA calculation utility.

**Test Categories:**

- **Invariants** - Properties that should always hold true:
  - GPA between 0-4 for normal scores
  - GPA is 0 for empty array
  - Deterministic output (same input → same output)
  - Order independence (commutative)
  - Perfect scores yield 4.0
  - Zero scores yield 0.0
  - No NaN or Infinity results
  - Proper rounding to 2 decimal places

- **Boundary Conditions:**
  - Very small maxScore values
  - Very large score values
  - Mixed perfect and zero scores
  - Single grade calculations

- **Edge Cases:**
  - Scores exceeding maxScore (extra credit)

**Run Count:** 100-1000 runs per test depending on complexity

### 2. `dto.property.e2e-spec.ts`

Property-based tests for common DTOs with numeric and boundary validations.

**DTOs Tested:**

#### PaginationQueryDto

- Valid ranges: page (1-10000), limit (1-100)
- sortDir enum validation ('asc'/'desc')
- Boundary violations (< min, > max values)
- Non-integer rejections
- Default value application

#### CreateFeeDto

- Positive amount validation (0.01 to 999M)
- Micro-transactions (cents)
- Large amounts
- Zero/negative rejection
- UUID format validation
- Date string validation
- Status enum validation

#### RecordPaymentDto

- Payment amount validation
- Optional reference field
- UUID validation
- Micro and large transaction handling

**Run Count:** 100-500 runs per test

### 3. `grades-dto.property.e2e-spec.ts`

Property-based tests for grade-related DTOs.

**Test Categories:**

#### Valid Inputs

- Score ranges (0-1000)
- Scores equal to maxScore
- Extra credit scores (> maxScore)
- Zero scores
- Decimal scores
- Batch grade operations (1-100 items)

#### Boundary Violations

- Negative scores
- Zero/negative maxScore
- Empty assignment names
- Names > 200 characters
- Invalid UUIDs
- Invalid date strings
- Empty grades array

#### Edge Cases

- Very small/large scores
- Mixed valid and boundary scores
- Assignment name boundaries (1 and 200 chars)
- Date ranges (1900-2100)

**Run Count:** 200-500 runs per test

## Benefits of Property-Based Testing

1. **Exhaustive Coverage**: Tests thousands of random inputs vs handful of examples
2. **Edge Case Discovery**: Finds corner cases developers might miss
3. **Shrinking**: fast-check automatically finds minimal failing case
4. **Documentation**: Properties describe invariants clearly
5. **Confidence**: Higher confidence in boundary behavior

## Running the Tests

### Install Dependencies

```bash
cd apps/backend
yarn install
```

### Run All Property Tests

```bash
yarn test property.e2e-spec
```

### Run Specific Test Suite

```bash
yarn test gpa.util.property.e2e-spec
yarn test dto.property.e2e-spec
yarn test grades-dto.property.e2e-spec
```

### Run with Coverage

```bash
yarn test:cov --testPathPattern=property.e2e-spec
```

**Note**: These tests are located in `apps/backend/test/` and use the `.e2e-spec.ts` extension to match the Jest e2e project configuration. They run alongside other e2e tests.

## Key Concepts

### Arbitraries

fast-check generators that produce random values:

- `fc.integer()` - integers within range
- `fc.double()` - floating point numbers
- `fc.string()` - strings with length constraints
- `fc.uuid()` - valid UUIDs
- `fc.date()` - dates within range
- `fc.array()` - arrays with size constraints
- `fc.record()` - objects with specified fields
- `fc.constantFrom()` - pick from enum values

### Properties

Assertions that should hold for all generated inputs:

```typescript
fc.assert(
  fc.property(fc.integer({ min: 0, max: 100 }), (score) => calculateGrade(score) >= 0 && calculateGrade(score) <= 100),
);
```

### Filters

Restrict generated values to specific conditions:

```typescript
fc.integer().filter((n) => n % 2 === 0); // Only even numbers
```

## Configuration

Property tests run:

- **Light tests**: 100-200 runs
- **Medium tests**: 300-500 runs
- **Heavy tests**: 1000 runs

Adjust `numRuns` parameter to balance speed vs coverage.

## Integration with CI

Property tests run as part of standard test suite:

```yaml
- name: Run tests
  run: yarn test
```

No special configuration needed.

## Lessons Learned

### Date Generation

Use realistic date ranges to avoid validation failures:

```typescript
fc.date({ min: new Date('1970-01-01'), max: new Date('2099-12-31') });
```

Dates like `-000001` (BC) or `+010000` (year 10000) fail ISO date string validation.

### Float vs Double

Use `fc.double()` for decimal values that aren't exactly representable as 32-bit floats:

```typescript
fc.double({ min: 0.1, max: 100 }); // ✅ Works
fc.float({ min: 0.1, max: 100 }); // ❌ Error: not 32-bit representable
```

### Boundary Conditions

When testing "greater than" conditions, ensure generated values actually exceed the boundary:

```typescript
fc.double({ min: 100.01, max: 120 }); // ✅ Actually > 100
fc.double({ min: 100, max: 120 }); // ❌ Can generate exactly 100
```

## Future Enhancements

- [ ] Add property tests for authentication DTOs
- [ ] Add property tests for schedule/timezone logic
- [ ] Implement custom arbitraries for domain objects
- [ ] Add shrinking examples to documentation
- [ ] Performance benchmarks for property tests
