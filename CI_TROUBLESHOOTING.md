# CI/CD Troubleshooting Guide

## Playwright E2E Test Issues

### Port Conflict Error

**Error**: `http://localhost:5173 is already used, make sure that nothing is running on the port/url or set reuseExistingServer:true in config.webServer.`

**Solution**: Updated `playwright.config.ts` to set `reuseExistingServer: true` to handle port conflicts in CI environments.

**Root Cause**: In CI environments, multiple test runs or parallel jobs may conflict on the same ports, or previous test runs may not have properly cleaned up server processes.

**Configuration Applied**:

```typescript
webServer: {
  command: 'yarn dev',
  url: 'http://localhost:5173',
  timeout: 180_000,
  reuseExistingServer: true, // Always reuse existing server to avoid port conflicts
  stderr: 'pipe',
  stdout: 'pipe',
}
```

### Alternative Solutions for Future Reference

If `reuseExistingServer: true` doesn't resolve the issue, consider:

1. **Dynamic Port Assignment**:

   ```typescript
   webServer: {
     command: 'yarn dev --port 0', // Let the system assign an available port
     url: 'http://localhost:5173',
     reuseExistingServer: !!process.env.CI,
   }
   ```

2. **CI-Specific Configuration**:

   ```typescript
   webServer: process.env.CI
     ? {
         // CI-specific configuration
         reuseExistingServer: true,
         timeout: 300_000,
       }
     : {
         // Local development configuration
         reuseExistingServer: false,
         timeout: 180_000,
       };
   ```

3. **Pre-test Cleanup** (in CI scripts):

   ```bash
   # Kill any existing processes on ports before running tests
   lsof -ti:5173 | xargs kill -9 || true
   lsof -ti:8080 | xargs kill -9 || true
   ```

### Testing the Fix

Run the following command to verify the fix works:

```bash
yarn test:e2e tests/e2e/happy-path.spec.ts
```

Expected result: Tests should pass without port conflict errors.
