# Running API Contract Tests

## Quick Start

### Run All API Contract Tests

```bash
# From project root
yarn test:api

# From backend directory
cd apps/backend
yarn test:api
```

## Available Test Commands

### Backend Test Commands

| Command           | Description                       | When to Use            |
| ----------------- | --------------------------------- | ---------------------- |
| `yarn test`       | Run all unit tests (excludes E2E) | Quick unit test run    |
| `yarn test:api`   | Run all API contract tests        | Test all endpoints     |
| `yarn test:cov`   | Run all tests with coverage       | Check coverage metrics |
| `yarn test:watch` | Run tests in watch mode           | During development     |

### From Project Root

| Command                            | Description                        |
| ---------------------------------- | ---------------------------------- |
| `yarn test`                        | Run backend unit tests             |
| `yarn test:api`                    | Run API contract tests             |
| `yarn --cwd apps/backend test:e2e` | Run backend E2E/API contract tests |

## Running Specific Tests

### Single Test File

```bash
# Run specific E2E test file
yarn --cwd apps/backend test auth.e2e-spec
yarn --cwd apps/backend test students.e2e-spec
yarn --cwd apps/backend test grades.e2e-spec
```

### Single Test Case

```bash
# Run specific test by name pattern
yarn --cwd apps/backend test -t "should login successfully"
yarn --cwd apps/backend test -t "should create student"
```

### Test File Pattern

```bash
# Run all auth-related tests
yarn --cwd apps/backend test auth

# Run all tests with "student" in the path
yarn --cwd apps/backend test student
```

## Test Output

### Successful Test Run

```text
PASS  test/auth.e2e-spec.ts
PASS  test/students.e2e-spec.ts
PASS  test/grades.e2e-spec.ts
...

Test Suites: 10 passed, 10 total
Tests:       127 passed, 127 total
Snapshots:   0 total
Time:        45.234 s
```

### Failed Test Run

```text
FAIL  test/auth.e2e-spec.ts
  ● AuthController (e2e) › POST /api/auth/login › should login successfully

    expect(received).toHaveProperty(property)

    Expected property: "access_token"
    Received object: {"statusCode": 401, "message": "Unauthorized"}
```

## Coverage Reports

### Generate Coverage

```bash
yarn --cwd apps/backend test:cov
```

### View Coverage Report

Coverage reports are generated in `apps/backend/coverage/`:

- **HTML Report**: Open `coverage/lcov-report/index.html` in browser
- **Console Output**: Shows in terminal after test run
- **Coverage Files**: For CI/CD integration

### Coverage Thresholds

See `API_CONTRACT_TESTING.md` for detailed coverage requirements.

## CI/CD Integration

### GitHub Actions / CI Pipeline

```yaml
# Run API contract tests
- name: Run API Tests
  run: yarn test:api

# Run with coverage
- name: Run Tests with Coverage
  run: yarn --cwd apps/backend test:cov

# Upload coverage to Codecov
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./apps/backend/coverage/lcov.info
```

## Troubleshooting

### Tests Not Found

If Jest can't find E2E tests:

1. Check `apps/backend/jest.config.js` includes:

   ```js
   testMatch: ['**/*.spec.ts', '**/*.e2e-spec.ts'];
   ```

1. Verify test files exist:

   ```bash
   ls apps/backend/test/*.e2e-spec.ts
   ```

### Database Connection Issues

E2E tests use SQLite in-memory database. If you see connection errors:

1. Check `ormconfig.ts` configuration
1. Ensure test data cleanup in `afterAll` hooks
1. Use `--detectOpenHandles` flag to debug

### Port Already in Use

If you get "port already in use" errors:

1. Stop any running dev servers
1. Kill processes using port 3000:

   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <pid> /F

   # Linux/Mac
   lsof -ti:3000 | xargs kill -9
   ```

### Timeout Errors

If tests timeout:

1. Increase Jest timeout in test file:

   ```typescript
   jest.setTimeout(30000); // 30 seconds
   ```

1. Or run with longer timeout:

   ```bash
   yarn test:api --testTimeout=30000
   ```

### Memory Issues

For large test suites:

```bash
# Increase Node memory
NODE_OPTIONS=--max_old_space_size=4096 yarn test:api
```

## Best Practices

### During Development

1. **Use watch mode** for rapid feedback:

   ```bash
   yarn --cwd apps/backend test:watch
   ```

1. **Run specific tests** you're working on:

   ```bash
   yarn --cwd apps/backend test auth -t "login"
   ```

1. **Check coverage** for new code:

   ```bash
   yarn --cwd apps/backend test:cov --collectCoverageFrom="src/auth/**/*.ts"
   ```

### Before Committing

1. **Run all tests**:

   ```bash
   yarn test:api
   ```

1. **Check for linter errors**:

   ```bash
   yarn --cwd apps/backend lint
   ```

1. **Verify coverage meets thresholds**:

   ```bash
   yarn --cwd apps/backend test:cov
   ```

### In CI/CD

1. **Run with coverage** for reporting
1. **Use `--runInBand`** for better stability
1. **Enable `--detectOpenHandles`** to catch leaks
1. **Set appropriate timeout** for CI environment

## Performance Tips

### Faster Test Runs

1. **Run tests in parallel** (default):

   ```bash
   yarn test:api --maxWorkers=4
   ```

1. **Run in band for debugging**:

   ```bash
   yarn test:api --runInBand
   ```

1. **Skip slow tests during development**:

   ```typescript
   it.skip('slow test', async () => {
     // ...
   });
   ```

### Optimize Test Setup

1. **Reuse test fixtures** where possible
1. **Use beforeAll** for expensive setup
1. **Clean up only what's necessary**
1. **Use transactions** for database tests

## Example Workflow

### Feature Development

```bash
# 1. Start development
cd apps/backend

# 2. Write tests in watch mode
yarn test:watch auth.e2e-spec

# 3. Implement feature
# ... code ...

# 4. Run all tests
yarn test:api

# 5. Check coverage
yarn test:cov

# 6. Commit
git add .
git commit -m "feat: add new endpoint"
```

### Bug Fix

```bash
# 1. Write failing test
yarn test:watch grades.e2e-spec

# 2. Fix bug
# ... code ...

# 3. Verify test passes
yarn test grades.e2e-spec

# 4. Run all tests to prevent regression
yarn test:api
```

## Summary

✅ Use `yarn test:api` to run all API contract tests  
✅ Use `yarn test:watch` during development  
✅ Use `yarn test:cov` before committing  
✅ Check `API_CONTRACT_TESTING.md` for standards  
✅ See `TEST_SUMMARY.md` for test inventory

---

**Need help?** Check the documentation:

- API Testing Standards: `API_CONTRACT_TESTING.md`
- Test Inventory: `TEST_SUMMARY.md`
- NestJS Testing: <https://docs.nestjs.com/fundamentals/testing>
