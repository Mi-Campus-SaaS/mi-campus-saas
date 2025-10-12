# Load Testing with k6

## Overview

Load testing infrastructure using [k6](https://k6.io/) to establish performance baselines and regression testing for Mi Campus SaaS.

## Prerequisites

Install k6:

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
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## Directory Structure

```text
tests/load/
├── scripts/          # Test scripts
│   ├── baseline.js   # Baseline test suite
│   ├── auth.js       # Authentication tests
│   ├── students.js   # Student API tests
│   ├── grades.js     # Grades API tests
│   └── smoke.js      # Quick smoke test
├── utils/            # Utilities
│   ├── auth.js       # Auth helpers
│   └── config.js     # Configuration
├── reports/          # Test results (gitignored)
└── README.md         # This file
```

## Running Tests

### Baseline Tests

Establish performance baseline (recommended after each major release):

```bash
yarn load:baseline
```

### Smoke Test

Quick validation (5 VUs, 30 seconds):

```bash
yarn load:smoke
```

### Individual Test Suites

```bash
yarn load:auth          # Authentication flow
yarn load:students      # Student API
yarn load:grades        # Grades API
```

### Custom Run

```bash
k6 run --vus 10 --duration 30s tests/load/scripts/baseline.js
```

## Test Stages

### Baseline Configuration

The baseline test follows this load profile:

1. **Ramp-up**: 0 → 10 VUs over 1 minute
2. **Steady**: 10 VUs for 3 minutes
3. **Peak**: 10 → 50 VUs over 1 minute
4. **Sustained**: 50 VUs for 2 minutes
5. **Ramp-down**: 50 → 0 VUs over 1 minute

Total duration: 8 minutes

## Thresholds

Performance SLIs/SLOs:

- **HTTP Errors**: < 1%
- **Response Time (p95)**: < 500ms
- **Response Time (p99)**: < 1000ms
- **Request Rate**: > 50 req/s

## Environment Variables

Configure test parameters via environment:

```bash
export API_BASE_URL=http://localhost:3000/api
export TEST_USERNAME=admin
export TEST_PASSWORD=Admin123!
```

Or use `.env` file:

```env
API_BASE_URL=http://localhost:3000/api
TEST_USERNAME=admin
TEST_PASSWORD=Admin123!
```

## Interpreting Results

k6 outputs key metrics after each test:

- **http_reqs**: Total requests
- **http_req_duration**: Response time distribution (p50, p95, p99)
- **http_req_failed**: Failed request rate
- **vus**: Virtual users
- **iterations**: Completed test iterations

### Success Criteria

✅ **Pass**: All thresholds met
❌ **Fail**: Any threshold exceeded

## Reports

HTML reports generated in `tests/load/reports/` with timestamp:

```text
reports/
├── baseline_2025-10-12_14-30-00.json
└── baseline_2025-10-12_14-30-00.html
```

Reports include:

- Request metrics
- Response time percentiles
- Error rates
- Threshold status

## CI/CD Integration

Baseline tests run on:

- Weekly schedule (Sunday 00:00 UTC)
- Before major releases
- Manual trigger via GitHub Actions

## Troubleshooting

### High error rates

1. Check backend is running: `curl http://localhost:3000/api/health`
2. Verify test credentials in `.env`
3. Check rate limiting configuration

### Timeouts

1. Increase timeout in test config: `timeout: '60s'`
2. Check backend logs for slow queries
3. Verify database performance

### Authentication failures

1. Verify test user exists: Check `apps/backend/src/seeds/seed.ts`
2. Run seed script: `yarn --cwd apps/backend seed`
3. Check JWT configuration

## Best Practices

1. **Consistent environment**: Always test against same backend state
2. **Isolated tests**: Run on dedicated test environment
3. **Version reports**: Track performance over time
4. **Monitor resources**: Check CPU, memory during tests
5. **Warm-up**: Allow backend to warm up before peak tests
