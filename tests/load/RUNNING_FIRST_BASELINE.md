# Running Your First Baseline Test

This guide walks you through executing the first baseline load test for Mi Campus SaaS.

## Prerequisites Checklist

- [ ] k6 installed (`k6 version` should work)
- [ ] Backend running on `localhost:3000`
- [ ] Database seeded with test data
- [ ] Test user credentials available

## Step 1: Install k6

### Windows

```powershell
winget install k6
```

Or download from: <https://k6.io/docs/getting-started/installation/>

### macOS

```bash
brew install k6
```

### Linux

```bash
# Debian/Ubuntu
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Verify Installation

```bash
k6 version
```

Expected output: `k6 v0.48.0 (2024-XX-XX)`

## Step 2: Start Backend Server

Open a terminal in the project root:

```bash
yarn dev:backend
```

Verify it's running:

```bash
curl http://localhost:3000/api/health
```

Expected: `"API is running!"`

## Step 3: Seed Test Data (if needed)

If your database is empty:

```bash
yarn --cwd apps/backend seed
```

This creates:

- Admin user: `admin` / `Admin123!`
- Test students with grades
- Sample teachers and classes

## Step 4: Verify Test Configuration

Check `tests/load/utils/config.js` has correct values:

```javascript
export const BASE_URL = __ENV.API_BASE_URL || "http://localhost:3000/api";
```

Default credentials in config:

- Username: `admin`
- Password: `Admin123!`

## Step 5: Run Smoke Test (Quick Validation)

Before running the full baseline, validate setup with smoke test:

```bash
yarn load:smoke
```

**Duration:** ~30 seconds  
**Load:** 5 virtual users

Expected output:

```text
✓ health check status is 200
✓ response time < 200ms

checks.........................: 100.00% ✓ 150 ✗ 0
http_req_duration..............: avg=45ms min=20ms med=42ms max=120ms p(95)=78ms p(99)=95ms
http_reqs......................: 150 (5/s)
```

If smoke test fails, troubleshoot before proceeding.

## Step 6: Run Baseline Test

Execute the full baseline suite:

```bash
yarn load:baseline
```

**Duration:** ~8 minutes  
**Load:** Ramps from 0 to 50 virtual users

### What Happens During Test

1. **Setup Phase** (5 seconds)
   - Authenticates admin user
   - Fetches student IDs for tests

2. **Ramp-up** (1 minute)
   - Gradually increases from 0 to 10 VUs

3. **Steady State** (3 minutes)
   - Maintains 10 VUs testing all endpoints

4. **Peak Load** (1 minute)
   - Ramps from 10 to 50 VUs

5. **Sustained Peak** (2 minutes)
   - Maintains 50 VUs under full load

6. **Ramp-down** (1 minute)
   - Gracefully decreases to 0 VUs

### Expected Output

```text
✓ health status is 200
✓ health response < 100ms
✓ students list status is 200
✓ students list has data
✓ students response < 300ms
...

health_check_success_rate......: 100.00% ✓ 2400 ✗ 0
students_success_rate..........: 99.8%   ✓ 2395 ✗ 5
grades_success_rate............: 98.5%   ✓ 2364 ✗ 36
schedule_success_rate..........: 100.00% ✓ 2400 ✗ 0

http_req_duration..............: avg=125ms p(95)=320ms p(99)=580ms
http_reqs......................: 12000 (25 req/s)
```

## Step 7: Review Generated Reports

Reports are saved in `tests/load/reports/`:

```text
tests/load/reports/
├── baseline_2025-10-12T14-30-00.json
└── baseline_2025-10-12T14-30-00.html
```

### JSON Report

Raw k6 metrics in JSON format:

```bash
cat tests/load/reports/baseline_*.json
```

### HTML Report

Open in browser for visual dashboard:

```bash
# Windows
start tests/load/reports/baseline_*.html

# macOS
open tests/load/reports/baseline_*.html

# Linux
xdg-open tests/load/reports/baseline_*.html
```

HTML report includes:

- Response time charts
- Success rate graphs
- Request distribution
- Error details

## Step 8: Update Baseline Report

Copy metrics from k6 output to `tests/load/BASELINE_REPORT.md`:

1. Open `BASELINE_REPORT.md`
2. Replace "TBD" values with actual metrics
3. Commit updated baseline to git

Example:

```diff
-| Total Requests | TBD | - | ✅ |
+| Total Requests | 12,000 | - | ✅ |

-| Request Rate | TBD req/s | > 50 req/s | ✅ |
+| Request Rate | 25 req/s | > 50 req/s | ❌ |
```

## Step 9: Commit Results to Repository

```bash
git add tests/load/
git commit -m "chore: establish load testing baseline"
git push origin develop
```

## Troubleshooting

### Error: "Setup failed: Could not authenticate"

**Cause:** Admin credentials incorrect or user doesn't exist

**Fix:**

```bash
yarn --cwd apps/backend seed
```

Or set environment variables:

```bash
export TEST_USERNAME=admin
export TEST_PASSWORD=Admin123!
yarn load:baseline
```

### Error: "ECONNREFUSED"

**Cause:** Backend not running

**Fix:**

```bash
yarn dev:backend
```

Wait for: `Application is running on: http://[::1]:3000`

### High Error Rate (> 5%)

**Possible causes:**

1. **Rate limiting** - Backend throttling requests
   - Solution: Adjust rate limits in `apps/backend/src/common/rate-limit.example.controller.ts`

2. **Database locks** - SQLite concurrency limits
   - Solution: Use PostgreSQL for testing

3. **Insufficient resources** - CPU/Memory exhausted
   - Solution: Close other applications or reduce VU count

### Slow Response Times (p95 > 500ms)

**Possible causes:**

1. **Cold start** - Backend not warmed up
   - Solution: Run smoke test first to warm up

2. **Database queries** - Unoptimized queries
   - Solution: Enable query logging and review slow queries

3. **Missing indexes** - Database needs optimization
   - Solution: Review database schema and add indexes

## Next Steps

1. **Run individual tests** to isolate performance bottlenecks:

   ```bash
   yarn load:auth      # Authentication only
   yarn load:students  # Students API only
   yarn load:grades    # Grades API only
   ```

2. **Set up CI/CD** to run baseline weekly

3. **Monitor trends** over time to detect regressions

4. **Run stress tests** to find breaking points

## Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Examples](https://k6.io/docs/examples/)
- [Performance Testing Guide](https://k6.io/docs/testing-guides/api-load-testing/)
- [k6 Thresholds](https://k6.io/docs/using-k6/thresholds/)
