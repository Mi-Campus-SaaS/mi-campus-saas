#!/usr/bin/env node
// Chrome launcher wrapper that always includes --no-sandbox flag
const { spawn } = require('child_process');
const puppeteer = require('puppeteer');

const chromePath = puppeteer.executablePath();
const args = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--disable-software-rasterizer',
  '--headless=new',
  '--disable-extensions',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
  '--disable-features=TranslateUI',
  '--disable-ipc-flooding-protection',
  '--max-old-space-size=4096',
  '--js-flags=--max-old-space-size=4096',
  '--disable-web-security',
  '--disable-features=VizDisplayCompositor',
  ...process.argv.slice(2),
];

const proc = spawn(chromePath, args, { stdio: 'inherit' });
proc.on('exit', (code) => process.exit(code || 0));

