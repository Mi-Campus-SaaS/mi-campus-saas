/* eslint-disable @typescript-eslint/no-var-requires */
const { spawnSync } = require('child_process');
const path = require('path');

function run() {
  const path = require('path');
  const fs = require('fs');
  
  let chromePath = '';
  try {
    const puppeteer = require('puppeteer');
    chromePath = puppeteer.executablePath();
  } catch (e) {
    console.error('Puppeteer is not installed. Install it to supply Chromium for Lighthouse.');
    process.exit(1);
  }

  // In CI, use a wrapper script that always includes --no-sandbox
  const wrapperPath = path.join(__dirname, 'chrome-launcher.js');
  const useWrapper = process.env.CI && fs.existsSync(wrapperPath);
  const finalChromePath = useWrapper ? wrapperPath : chromePath;

  const env = { 
    ...process.env, 
    CHROME_PATH: finalChromePath, 
    GOOGLE_CHROME_PATH: finalChromePath,
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: 'false',
  };
  const cmd = `lhci autorun --config=apps/frontend/lighthouserc.cjs`;
  const result = spawnSync(cmd, { stdio: 'inherit', env, shell: true });

  process.exit(result.status ?? 1);
}

run();


