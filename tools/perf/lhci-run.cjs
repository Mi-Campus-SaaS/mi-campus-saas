/* eslint-disable @typescript-eslint/no-var-requires */
const { spawnSync } = require('child_process');
const path = require('path');

function run() {
  let chromePath = '';
  try {
    const puppeteer = require('puppeteer');
    chromePath = puppeteer.executablePath();
  } catch (e) {
    console.error('Puppeteer is not installed. Install it to supply Chromium for Lighthouse.');
    process.exit(1);
  }

  const env = { ...process.env, CHROME_PATH: chromePath, GOOGLE_CHROME_PATH: chromePath };
  const cmd = `lhci autorun --config=apps/frontend/lighthouserc.cjs`;
  const result = spawnSync(cmd, { stdio: 'inherit', env, shell: true });

  process.exit(result.status ?? 1);
}

run();


