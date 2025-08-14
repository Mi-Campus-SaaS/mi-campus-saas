// Use Puppeteer's bundled Chromium so CI and local runs don't require system Chrome
const puppeteer = require('puppeteer');

/** @type {import('@lhci/cli/src/index').LHCIConfig} */
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'yarn --cwd apps/frontend preview',
      url: ['http://localhost:4173/es'],
      numberOfRuns: 1,
      settings: {
        chromePath: process.env.CHROME_PATH || puppeteer.executablePath(),
        // Keep consistent desktop profile
        formFactor: 'desktop',
        screenEmulation: { mobile: false },
        // GitHub Actions often needs these flags
        chromeFlags: ['--no-sandbox', '--disable-setuid-sandbox', '--headless=new'],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.85 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1800, aggregationMethod: 'median' }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500, aggregationMethod: 'median' }],
        'total-blocking-time': ['error', { maxNumericValue: 300, aggregationMethod: 'median' }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1, aggregationMethod: 'median' }],
      },
    },
  },
};


