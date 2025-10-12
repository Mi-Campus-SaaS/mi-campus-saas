# k6 Load Testing - Quick Start

## Install k6

**Windows:**

```powershell
winget install k6
```

**macOS:**

```bash
brew install k6
```

**Linux:**

```bash
sudo apt-get install k6
```

## Run Your First Test

### 1. Start Backend

```bash
yarn dev:backend
```

### 2. Run Smoke Test

```bash
yarn load:smoke
```

**Expected:** ✅ All checks pass in ~30 seconds

### 3. Run Baseline

```bash
yarn load:baseline
```

**Duration:** 8 minutes  
**Result:** HTML + JSON reports in `tests/load/reports/`

## Available Tests

| Command              | Duration | Purpose             |
| -------------------- | -------- | ------------------- |
| `yarn load:smoke`    | 30s      | Quick validation    |
| `yarn load:auth`     | 2m       | Authentication flow |
| `yarn load:students` | 3m       | Students API        |
| `yarn load:grades`   | 3m       | Grades API          |
| `yarn load:baseline` | 8m       | Full baseline suite |

## View Reports

Reports are in `tests/load/reports/`:

```bash
# Open HTML report (Windows)
start tests\load\reports\baseline_*.html

# macOS
open tests/load/reports/baseline_*.html

# Linux
xdg-open tests/load/reports/baseline_*.html
```

## Troubleshooting

**Error: ECONNREFUSED**
→ Backend not running: `yarn dev:backend`

**Error: Setup failed**
→ Seed database: `yarn --cwd apps/backend seed`

**High error rate**
→ Check backend logs

## Next Steps

1. Review [README.md](README.md) for full documentation
2. Follow [RUNNING_FIRST_BASELINE.md](RUNNING_FIRST_BASELINE.md) for detailed walkthrough
3. Update [BASELINE_REPORT.md](BASELINE_REPORT.md) with your results
4. Commit reports to repository

## CI/CD

Load tests run automatically on:

- ✅ Pull requests (smoke test)
- ✅ Weekly schedule (baseline)
- ✅ Manual trigger (any test)

See `.github/workflows/load-test.yml`
