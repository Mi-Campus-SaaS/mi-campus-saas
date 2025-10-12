# Test Infrastructure Fixes

## Issues Fixed

### 1. Database Concurrency Conflicts

**Problem:**

- Multiple E2E tests running in parallel accessed the same PostgreSQL database
- Concurrent `resetDatabase()` calls caused schema conflicts:
  - `duplicate key value violates unique constraint "pg_type_typname_nsp_index"`
  - `relation "verification_token" does not exist`

**Solution:**

- Configured Jest with separate projects for unit and E2E tests
- E2E tests now run serially (`maxWorkers: 1`) to prevent database conflicts
- Unit tests still run in parallel for speed

### 2. Database Reset Race Conditions

**Problem:**

- When tests ran in parallel, multiple instances tried to drop/create database schema simultaneously
- No synchronization mechanism to prevent concurrent resets

**Solution:**

- Added a semaphore pattern in `test-helpers.ts`
- Queue-based synchronization ensures only one reset at a time
- Added retry logic for transient database errors
- Better error handling for database operations

### 3. Service Initialization Issues

**Problem:**

- `PasswordResetService.onModuleInit()` tried to clean up expired tokens on startup
- During tests, database tables might not exist yet, causing errors

**Solution:**

- Added error handling in `PasswordResetService.onModuleInit()`
- Gracefully handles "table doesn't exist" errors in test environment
- Service continues to work even if initial cleanup fails

## Configuration Changes

### `jest.config.js`

Changed from single configuration to multi-project setup:

```javascript
{
  projects: [
    {
      displayName: 'unit',
      roots: ['<rootDir>/src'],
      testMatch: ['**/*.spec.ts'],
      // Runs in parallel with maxWorkers from CLI or default
    },
    {
      displayName: 'e2e',
      roots: ['<rootDir>/test'],
      testMatch: ['**/*.e2e-spec.ts'],
      maxWorkers: 1, // Serial execution
    },
  ],
}
```

### `test-helpers.ts`

Added synchronization and error handling:

```typescript
- Added semaphore: `isResettingDatabase` flag
- Added queue: `resetQueue` for pending resets
- Retry logic for concurrent operation errors
- Better error handling in `closeTestApp()`
```

### `password-reset.service.ts`

Added graceful error handling:

```typescript
- Try-catch in `onModuleInit()`
- Handles missing tables in test environment
- Logs warnings instead of throwing errors
- Service remains functional even if initial cleanup fails
```

## Test Results

**Before fixes:**

- Test Suites: 7 failed, 16 passed (70% passing)
- Tests: 85 failed, 135 passed (61% passing)

**After fixes:**

- Test Suites: 23 passed, 0 failed (100% passing) ✅
- Tests: 220 passed, 0 failed (100% passing) ✅

**Improvement:**

- ✅ Eliminated ALL 7 failing test suites (70% → 100%)
- ✅ Fixed ALL 85 failing tests (61% → 100%)
- ✅ All unit tests passing (17/17 suites)
- ✅ All E2E tests passing (6/6 suites)
- ✅ Resolved all database concurrency conflicts
- ✅ Resolved PostgreSQL catalog constraint violations

## Final Solution

The breakthrough came from switching from `dropDatabase()` + `synchronize()` to a **TRUNCATE-based strategy**:

```typescript
// Disable foreign keys temporarily
await dataSource.query('SET session_replication_role = replica;');

// Truncate all tables
for (const entity of entities) {
  await dataSource.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE;`);
}

// Re-enable foreign keys
await dataSource.query('SET session_replication_role = DEFAULT;');
```

**Why this works:**

1. **Faster** - No need to drop and recreate schema
2. **Avoids catalog conflicts** - Doesn't recreate types and indexes
3. **Maintains schema** - Tables persist between test suites
4. **Proper cleanup** - CASCADE ensures all data is removed

Combined with:

- **Serial execution** at root level (`maxWorkers: 1`)
- **Semaphore pattern** to prevent concurrent resets
- **Graceful fallback** with delays if truncate fails

## Running Tests

```bash
# Run all tests (unit + e2e)
yarn --cwd apps/backend test

# Run only unit tests (faster)
yarn --cwd apps/backend test --selectProjects=unit

# Run only e2e tests
yarn --cwd apps/backend test --selectProjects=e2e

# Run specific test file
yarn --cwd apps/backend test --testPathPattern=auth.e2e-spec.ts
```

## Best Practices

1. **Always use `maxWorkers: 1` for E2E tests** - Database operations are not safe for concurrent execution
2. **Use `resetDatabase()` in `beforeAll`**, not `beforeEach` - Reduces test execution time
3. **Clean up timers/intervals** - Use `clearInterval()` in `afterAll` to prevent open handles
4. **Handle service initialization gracefully** - Services should work even if optional cleanup fails

## Future Improvements

1. **Test database per suite** - Generate unique database names per test file
2. **Transaction rollback pattern** - Use transactions and rollback instead of full resets
3. **Global setup/teardown** - Create database once for all tests, clean between suites
4. **Mock time-based operations** - Mock timers in services to avoid real intervals in tests
