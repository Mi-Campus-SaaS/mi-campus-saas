# Production Deployment Checklist

## 🗑️ Pre-Deployment Cleanup

### Files Already Cleaned

- ✅ `test-output.txt` - Deleted

### Test Databases to Clean (PostgreSQL)

Run this command to clean up test databases:

```bash
# List test databases
psql -h localhost -U postgres -c "\l" | grep micampus_test

# Drop test databases
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS micampus_test;"
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS micampus_test_e2e;"
```

### Files Excluded from Production (via .dockerignore)

- Test directories: `apps/*/test/`, `tests/e2e/`
- Test files: `*.spec.ts`, `*.e2e-spec.ts`
- Development tools: `scripts/`, `tools/`
- Documentation: Most `.md` files (except README.md)
- Environment files: `.env` (use production secrets)

## 🔒 Security Checklist

### Environment Variables

Ensure these are set securely in production:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/micampus_prod
DB_TYPE=postgres

# JWT Secrets (32+ characters)
JWT_SECRET=<secure-random-string>
JWT_REFRESH_SECRET=<secure-random-string>

# SMTP (for emails)
SMTP_HOST=<your-smtp-host>
SMTP_PORT=<smtp-port>
SMTP_USER=<smtp-user>
SMTP_PASSWORD=<smtp-password>

# Frontend URL
FRONTEND_URL=https://your-production-domain.com

# Storage (if using S3)
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
AWS_REGION=<region>
AWS_S3_BUCKET=<bucket-name>

# Redis (for queues/cache)
REDIS_HOST=<redis-host>
REDIS_PORT=6379
REDIS_PASSWORD=<redis-password>

# Telemetry (optional)
OTEL_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=<jaeger-endpoint>

# Security
NODE_ENV=production
```

### Database Migrations

```bash
# Run migrations before deployment
cd apps/backend
yarn migration:run
```

### Build Commands

```bash
# Frontend
cd apps/frontend
yarn build

# Backend
cd apps/backend
yarn build
```

## 📊 Performance Optimization

### Frontend

- ✅ Code splitting configured
- ✅ Virtual scrolling for large lists
- ✅ PWA enabled
- ✅ Bundle budgets configured

### Backend

- ✅ Caching interceptor enabled
- ✅ Database indexing configured
- ✅ Rate limiting enabled
- ✅ OpenTelemetry tracing

## 🔍 Pre-Deployment Tests

```bash
# Run all tests
yarn test

# Run E2E tests
yarn test:e2e

# Security audit
yarn security:audit

# Bundle size check
yarn budgets:bundle

# Lint check
yarn lint
```

## 📦 What Gets Deployed

### Included in Production

- `apps/backend/dist/` - Compiled backend code
- `apps/frontend/dist/` - Compiled frontend static files
- `node_modules/` - Production dependencies only
- `apps/backend/src/i18n/` - Translation files
- `apps/backend/src/database/migrations/` - Database migrations
- `package.json`, `yarn.lock` - Dependency manifests

### Excluded from Production

- All test files (`*.spec.ts`, `*.e2e-spec.ts`)
- Test directories (`test/`, `tests/`)
- Development scripts (`scripts/`, `tools/`)
- Source `.ts` files (compiled to `dist/`)
- Documentation files (most `.md`)
- Development databases
- `.env` files (use production secrets)

## 🚀 Deployment Methods

### Option 1: Docker (Recommended)

```dockerfile
# Create Dockerfile in root
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/frontend/dist ./apps/frontend/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/apps/backend/src/i18n ./apps/backend/src/i18n
COPY --from=builder /app/apps/backend/src/database/migrations ./apps/backend/src/database/migrations

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "apps/backend/dist/main.js"]
```

### Option 2: Traditional Server

```bash
# On server
git pull origin main
yarn install --frozen-lockfile --production
yarn build
pm2 restart mi-campus-backend
```

## 🔄 Post-Deployment

1. **Health Check**: `GET /api/health`
2. **Monitor Logs**: Check application logs
3. **Database**: Verify migrations ran successfully
4. **Redis**: Check queue processing
5. **Telemetry**: Verify traces in Jaeger (if enabled)

## 📞 Rollback Plan

```bash
# Rollback database
cd apps/backend
yarn migration:revert

# Rollback application
git checkout <previous-commit>
yarn install --frozen-lockfile
yarn build
pm2 restart mi-campus-backend
```
