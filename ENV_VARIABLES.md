# Environment Variables Reference

This document lists all environment variables used in the project and indicates which are required vs optional.

## Backend Environment Variables

### Required Variables

These must be set or the application will fail to start:

- `JWT_SECRET` - JWT signing secret (minimum 32 characters)
- `JWT_REFRESH_SECRET` - JWT refresh token secret (minimum 32 characters)

### Optional Variables (with defaults)

#### Application Configuration

- `NODE_ENV` - Environment mode: `development`, `production`, or `test` (default: `development`)
- `PORT` - Server port (default: `3000`)
- `FRONTEND_URL` - Frontend URL for CORS (default: `http://localhost:5173`)

#### JWT Configuration

- `JWT_EXPIRES_IN` - Access token expiration (default: `15m`)
- `JWT_ACCESS_EXPIRES_IN` - Access token expiration (default: `15m`)
- `JWT_REFRESH_EXPIRES_IN` - Refresh token expiration (default: `7d`)

#### Database Configuration

Choose one of the following:

**SQLite (default for development):**

- `DATABASE_PATH` - Path to SQLite database file (default: `./data/dev.sqlite`)

**PostgreSQL:**

- `DB_TYPE` - Database type: `postgres` or `sqlite` (default: `sqlite` for dev, `postgres` for prod)
- `PGHOST` - PostgreSQL host (default: `localhost`)
- `PGPORT` - PostgreSQL port (default: `5432`)
- `PGUSER` - PostgreSQL user (default: `postgres`)
- `PGPASSWORD` - PostgreSQL password (default: `postgres`)
- `PGDATABASE` - PostgreSQL database name (default: `micampus`)
- `PG_SSL` - Enable SSL for PostgreSQL (default: `false`)
- `DATABASE_SSL` - Alternative SSL flag (default: `false`)

**PostgreSQL Connection String (alternative):**

- `DATABASE_URL` - Full PostgreSQL connection string (e.g., `postgresql://user:password@localhost:5432/micampus`)

#### Redis Configuration (for Bull queues and rate limiting)

- `REDIS_HOST` - Redis host (default: `localhost`)
- `REDIS_PORT` - Redis port (default: `6379`)
- `REDIS_PASSWORD` - Redis password (optional)
- `REDIS_DB` - Redis database number for Bull queues (default: `0`)
- `REDIS_RATE_LIMIT_DB` - Redis database number for rate limiting (default: `1`)

#### File Upload

- `UPLOAD_DIR` - Directory for file uploads (default: `uploads`)
- `ALLOWED_MATERIAL_EXT` - Allowed file extensions (default: `pdf,png,jpg,jpeg,zip`)
- `MAX_MATERIAL_SIZE_BYTES` - Maximum file size in bytes (default: `10485760` = 10MB)

#### Storage Configuration

- `STORAGE_MODE` - Storage mode: `local` or `s3` (default: `local`)
- `S3_ENDPOINT` - S3/MinIO endpoint (required if `STORAGE_MODE=s3`)
- `S3_REGION` - S3 region (required if `STORAGE_MODE=s3`)
- `S3_BUCKET` - S3 bucket name (required if `STORAGE_MODE=s3`)
- `S3_ACCESS_KEY_ID` - S3 access key (required if `STORAGE_MODE=s3`)
- `S3_SECRET_ACCESS_KEY` - S3 secret key (required if `STORAGE_MODE=s3`)
- `S3_FORCE_PATH_STYLE` - Force path-style URLs (default: `true` for MinIO)
- `PUBLIC_BASE_URL` - Base URL for file URLs (optional, e.g., `http://localhost:8080`)

#### Throttling & Rate Limiting

- `THROTTLE_TTL_SECONDS` - Global throttle TTL (default: `60`)
- `THROTTLE_LIMIT` - Global throttle limit (default: `100`)
- `AUTH_THROTTLE_LIMIT` - Auth endpoint throttle limit (default: `5`)
- `AUTH_THROTTLE_TTL_SECONDS` - Auth endpoint throttle TTL (default: `60`)
- `MATERIALS_THROTTLE_LIMIT` - Materials endpoint throttle limit (default: `20`)
- `MATERIALS_THROTTLE_TTL_SECONDS` - Materials endpoint throttle TTL (default: `60`)
- `FINANCE_THROTTLE_LIMIT` - Finance endpoint throttle limit (default: `30`)
- `FINANCE_THROTTLE_TTL_SECONDS` - Finance endpoint throttle TTL (default: `60`)
- `RATE_LIMIT_ENABLED` - Enable rate limiting (default: `true`)
- `RATE_LIMIT_DEFAULT_LIMIT` - Default rate limit (default: `100`)
- `RATE_LIMIT_DEFAULT_WINDOW_MS` - Default rate limit window (default: `60000`)
- `RATE_LIMIT_USER_LIMIT` - Per-user rate limit (default: `200`)
- `RATE_LIMIT_USER_WINDOW_MS` - Per-user rate limit window (default: `60000`)
- `RATE_LIMIT_IP_LIMIT` - Per-IP rate limit (default: `150`)
- `RATE_LIMIT_IP_WINDOW_MS` - Per-IP rate limit window (default: `60000`)
- `RATE_LIMIT_ROUTE_LIMIT` - Per-route rate limit (default: `300`)
- `RATE_LIMIT_ROUTE_WINDOW_MS` - Per-route rate limit window (default: `60000`)

#### Account Security

- `AUTH_MAX_FAILED_ATTEMPTS` - Max failed login attempts before lockout (default: `5`)
- `AUTH_LOCKOUT_DURATION_MINUTES` - Account lockout duration (default: `30`)

#### Password Policy

- `AUTH_PASSWORD_MIN_LENGTH` - Minimum password length (default: `8`)
- `AUTH_PASSWORD_REQUIRE_UPPERCASE` - Require uppercase letters (default: `true`)
- `AUTH_PASSWORD_REQUIRE_LOWERCASE` - Require lowercase letters (default: `true`)
- `AUTH_PASSWORD_REQUIRE_NUMBERS` - Require numbers (default: `true`)
- `AUTH_PASSWORD_REQUIRE_SPECIAL_CHARS` - Require special characters (default: `true`)

#### HTTP Caching

- `HTTP_CACHE_TTL_SECONDS` - HTTP cache TTL in seconds (default: `300`)

#### OpenTelemetry

- `OTEL_ENABLED` - Enable OpenTelemetry tracing (default: `true`)
- `OTEL_EXPORTER_OTLP_ENDPOINT` - OTLP endpoint (default: `http://localhost:4318/v1/traces`)
- `OTEL_SERVICE_NAME` - Service name (default: `mi-campus-backend`)
- `OTEL_SERVICE_VERSION` - Service version (default: `1.0.0`)

#### SMTP Configuration

- `SMTP_HOST` - SMTP server host (default: `localhost`)
- `SMTP_PORT` - SMTP server port (default: `1025`)
- `SMTP_SECURE` - Use TLS/SSL (default: `false`)
- `SMTP_USER` - SMTP username (optional)
- `SMTP_PASS` - SMTP password (optional)
- `SMTP_FROM` - From email address (default: `Mi Campus <noreply@micampus.local>`)

#### CORS Configuration

- `CORS_ALLOWLIST` - Comma-separated list of allowed origins (default: `http://localhost:5173,http://localhost:8080`)
- `CORS_ALLOW_SERVER_TO_SERVER` - Allow server-to-server requests (default: `false`)

## Frontend Environment Variables

### Optional Variables (with defaults)

- `VITE_API_URL` - Backend API URL (default: `http://localhost:3000/api`)
- `VITE_OTEL_ENDPOINT` - OpenTelemetry endpoint (default: `http://localhost:14318/v1/traces`)

## Quick Setup

### Backend

Create `apps/backend/.env` with at minimum:

```bash
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-at-least-32-characters-long
```

For PostgreSQL:

```bash
DB_TYPE=postgres
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=micampus
```

### Frontend

Create `apps/frontend/.env` (optional, defaults work for local dev):

```bash
VITE_API_URL=http://localhost:8080/api
VITE_OTEL_ENDPOINT=http://localhost:4318/v1/traces
```

## Notes

- All variables with defaults are optional and will use sensible defaults if not provided
- Only `JWT_SECRET` and `JWT_REFRESH_SECRET` are required for the backend
- Frontend variables are all optional and have defaults
- See `apps/backend/.env.example` and `apps/frontend/.env.example` for complete examples
