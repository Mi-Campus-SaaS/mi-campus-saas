import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: 'tests/e2e',
  timeout: 120_000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    trace: 'on-first-retry',
    extraHTTPHeaders: {
      Origin: 'http://localhost:5173',
    },
  },
  webServer: {
    command: 'yarn dev',
    url: 'http://localhost:5173',
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
  reporter: [['list']]
};

export default config;


