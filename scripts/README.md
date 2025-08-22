# Pre-commit Scripts

This directory contains comprehensive pre-commit scripts that run all quality checks before allowing commits.

## Available Scripts

### Bash Script (Linux/macOS/Git Bash)

- `pre-commit.sh` - Full pre-commit check
- `pre-commit.sh --skip-tests` - Pre-commit check without running tests

### PowerShell Script (Windows)

- `pre-commit.ps1` - Full pre-commit check
- `pre-commit.ps1 -SkipTests` - Pre-commit check without running tests

## Package.json Scripts

The following scripts are available in the root `package.json`:

```bash
# Full pre-commit check
yarn pre-commit          # Bash (Linux/macOS/Git Bash)
yarn pre-commit:win      # PowerShell (Windows)

# Fast pre-commit check (skips tests)
yarn pre-commit:fast     # Bash
yarn pre-commit:win:fast # PowerShell
```

## What the Scripts Do

1. **Format Code** - Runs Prettier on all code files
2. **Lint Code** - Runs ESLint on TypeScript/JavaScript files and markdownlint on documentation
3. **Type Checking** - Runs TypeScript compiler in `--noEmit` mode for both frontend and backend
4. **Run Tests** - Executes Jest tests for backend (and frontend if configured)
5. **Build Check** - Ensures both frontend and backend can build successfully
6. **Git Status Check** - Warns about any uncommitted changes after formatting

## Usage Examples

### Manual Pre-commit Check

```bash
# From project root
yarn pre-commit
```

### Skip Tests (Faster)

```bash
# When you want to skip tests for faster feedback
yarn pre-commit:fast
```

### Direct Script Execution

```bash
# Bash
./scripts/pre-commit.sh
./scripts/pre-commit.sh --skip-tests

# PowerShell (Windows)
powershell -ExecutionPolicy Bypass -File scripts/pre-commit.ps1
powershell -ExecutionPolicy Bypass -File scripts/pre-commit.ps1 -SkipTests
```

## Git Hook Integration

The pre-commit script is automatically integrated with Git hooks using Husky. Two hooks are available:

### Default Pre-commit Hook (`.husky/pre-commit`)

- Runs `lint-staged` first (for staged files only)
- Then runs `yarn pre-commit:fast` (skips tests for speed)
- **Recommended for daily development**

### Full Pre-commit Hook (`.husky/pre-commit-full`)

- Runs `lint-staged` first (for staged files only)
- Then runs `yarn pre-commit` (includes all tests)
- **Use for important commits or before merging**

### Switching Between Hooks

To use the full checks (including tests) for a specific commit:

```bash
# Temporarily rename the default hook
mv .husky/pre-commit .husky/pre-commit-fast
mv .husky/pre-commit-full .husky/pre-commit

# Make your commit
git commit -m "your message"

# Restore the default hook
mv .husky/pre-commit .husky/pre-commit-full
mv .husky/pre-commit-fast .husky/pre-commit
```

### Manual Git Hook Setup (Alternative)

If you prefer to set up hooks manually:

1. Create `.git/hooks/pre-commit`
2. Add the appropriate script call based on your OS

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Run pre-commit checks
yarn pre-commit:fast

# Exit with the same code as the pre-commit script
exit $?
```

## Troubleshooting

### Windows PowerShell Execution Policy

If you get execution policy errors on Windows, run:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Permission Denied (Linux/macOS)

Make the script executable:

```bash
chmod +x scripts/pre-commit.sh
```

### TypeScript Errors

If you get TypeScript errors, ensure:

- All dependencies are installed (`yarn install`)
- TypeScript is properly configured in both apps
- No type errors exist in your code

## Exit Codes

- `0` - All checks passed
- `1` - One or more checks failed

The script will stop at the first failure and show detailed error information.
