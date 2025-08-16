// Use Puppeteer's bundled Chromium so CI and local runs don't require system Chrome
const puppeteer = require('puppeteer');

/** @type {import('@lhci/cli/src/index').LHCIConfig} */
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'yarn dev',
      url: ['http://localhost:5173/es'],
      numberOfRuns: 1,
      settings: {
        chromePath: process.env.CHROME_PATH || puppeteer.executablePath(),
        // Keep consistent desktop profile
        formFactor: 'desktop',
        screenEmulation: { mobile: false },
        // GitHub Actions often needs these flags
        chromeFlags: ['--no-sandbox', '--disable-setuid-sandbox', '--headless=new', '--disable-dev-shm-usage'],
      },
    },
    assert: {
      assertions: {
        // More lenient thresholds for dev/CI environment
        'categories:performance': ['warn', { minScore: 0.3 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 15000, aggregationMethod: 'median' }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 30000, aggregationMethod: 'median' }],
        'total-blocking-time': ['warn', { maxNumericValue: 1000, aggregationMethod: 'median' }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.2, aggregationMethod: 'median' }],
      },
    },
  },
};


