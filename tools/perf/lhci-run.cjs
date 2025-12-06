/* eslint-disable @typescript-eslint/no-var-requires, n/prefer-node-protocol */
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function run() {
  let chromePath = '';
  try {
    const puppeteer = require('puppeteer');
    chromePath = puppeteer.executablePath();
  } catch (error) {
    console.error('Puppeteer is not installed. Install it to supply Chromium for Lighthouse.');
    console.error(error);
    process.exit(1);
  }

  const wrapperPath = path.join(__dirname, 'chrome-launcher.js');
  const useWrapper = process.env.CI && fs.existsSync(wrapperPath);
  const finalChromePath = useWrapper ? wrapperPath : chromePath;

  const env = {
    ...process.env,
    CHROME_PATH: process.env.CHROME_PATH || finalChromePath,
    GOOGLE_CHROME_PATH: process.env.CHROME_PATH || finalChromePath,
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD || 'false',
  };
  
  if (process.env.CI) {
    env.CI = process.env.CI;
  }

  const configPath = path.resolve(__dirname, '..', 'apps', 'frontend', 'lighthouserc.cjs');
  const cmd = `lhci autorun --config=${configPath}`;
  const result = spawnSync(cmd, { stdio: 'inherit', env, shell: true });

  process.exit(result.status ?? 1);
}

run();


