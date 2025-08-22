#!/usr/bin/env node

/**
 * Pre-commit script for mi-campus-saas
 * Runs all quality checks before allowing commit
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Parse command line arguments
const args = process.argv.slice(2);
const skipTests = args.includes('--skip-tests');

// Helper functions
function printStatus(message) {
  console.log(`${colors.blue}==>${colors.reset} ${message}`);
}

function printSuccess(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function printError(message) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
}

function printWarning(message) {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function hasTestScript(packageJsonPath) {
  try {
    const content = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(content);
    return packageJson.scripts && packageJson.scripts.test;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🔍 Running pre-commit checks...\n');

  // Check if we're in the right directory
  if (!checkFileExists('package.json')) {
    printError('Must run from project root directory');
    process.exit(1);
  }

  try {
    // 1. Format code
    printStatus('Formatting code...');
    await runCommand('yarn', ['format']);
    printSuccess('Code formatting complete');

    // 2. Lint code
    printStatus('Linting code...');
    await runCommand('yarn', ['lint']);
    printSuccess('Linting complete');

    // 3. Type checking
    printStatus('Checking TypeScript types...');

    // Frontend type check
    printStatus('  Frontend type check...');
    await runCommand('yarn', ['tsc', '--noEmit'], { cwd: 'apps/frontend' });
    printSuccess('  Frontend types OK');

    // Backend type check
    printStatus('  Backend type check...');
    await runCommand('yarn', ['tsc', '--noEmit'], { cwd: 'apps/backend' });
    printSuccess('  Backend types OK');

    printSuccess('Type checking complete');

    // 4. Run tests (unless skipped)
    if (!skipTests) {
      printStatus('Running tests...');

      // Backend tests
      printStatus('  Backend tests...');
      await runCommand('yarn', ['test']);
      printSuccess('  Backend tests passed');

      // Frontend tests (if any)
      const frontendPackageJson = 'apps/frontend/package.json';
      if (checkFileExists(frontendPackageJson) && hasTestScript(frontendPackageJson)) {
        printStatus('  Frontend tests...');
        await runCommand('yarn', ['test'], { cwd: 'apps/frontend' });
        printSuccess('  Frontend tests passed');
      } else {
        printWarning('  No frontend tests configured');
      }

      printSuccess('Tests complete');
    } else {
      printWarning('Skipping tests (--skip-tests flag used)');
    }

    // 5. Build check
    printStatus('Building applications...');

    // Frontend build
    printStatus('  Frontend build...');
    await runCommand('yarn', ['build'], { cwd: 'apps/frontend' });
    printSuccess('  Frontend build successful');

    // Backend build
    printStatus('  Backend build...');
    await runCommand('yarn', ['build'], { cwd: 'apps/backend' });
    printSuccess('  Backend build successful');

    printSuccess('Build check complete');

    // 6. Optional: Check for uncommitted changes
    try {
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
      if (gitStatus.trim()) {
        printWarning('There are uncommitted changes after formatting');
        printStatus('You may want to review and commit these changes');
      }
    } catch (error) {
      // Git not available or not a git repo, ignore
    }

    console.log('');
    printSuccess('All pre-commit checks passed! 🎉');
    console.log('');
    printStatus('You can now commit your changes safely.');

  } catch (error) {
    printError(`Pre-commit check failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  printError(`Unexpected error: ${error.message}`);
  process.exit(1);
});
