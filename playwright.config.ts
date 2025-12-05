import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: 'tests/e2e',
  timeout: 120_000,
  retries: process.env.CI ? 2 : 1,
  snapshotPathTemplate: '{testDir}/{testFileName}-snapshots/{arg}{ext}',
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      threshold: 0.2,
    },
  },
  outputDir: 'test-results',
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    extraHTTPHeaders: {
      Origin: 'http://localhost:5173',
    },
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: 'yarn dev',
    url: 'http://localhost:5173',
    timeout: 180_000,
    reuseExistingServer: true,
    stderr: 'pipe',
    stdout: 'pipe',
  },
  reporter: process.env.CI
    ? [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : [['list']],
};

export default config;


