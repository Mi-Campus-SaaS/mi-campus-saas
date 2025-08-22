Mi Campus SaaS (Monorepo)

Commands

- yarn dev: runs frontend (Vite) and backend (NestJS) together
- yarn dev:frontend: start Vite
- yarn dev:backend: start Nest in watch mode
- yarn build: build both apps
- yarn test: run backend unit tests
- yarn format: format backend code (run after implementations)
- yarn lint: run linters for frontend and backend

Backend setup

- Copy `apps/backend/.env.example` to `apps/backend/.env`
- yarn dev:backend
- Seed data: `yarn --cwd apps/backend seed:dev` (creates deterministic admin/teacher/student, a class, a session, and an enrollment)

Environment variables (backend)

Create `apps/backend/.env` and set as needed (defaults shown):

```bash
PORT=3000
FRONTEND_URL=http://localhost:5173
DATABASE_PATH=./data/dev.sqlite
JWT_SECRET=dev_secret_change_me
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=dev_refresh_secret_change_me
JWT_REFRESH_EXPIRES_IN=7d
UPLOAD_DIR=uploads
# Throttling
THROTTLE_TTL_SECONDS=60
THROTTLE_LIMIT=100
AUTH_THROTTLE_TTL_SECONDS=60
AUTH_THROTTLE_LIMIT=5
# Account Lockout
AUTH_MAX_FAILED_ATTEMPTS=5
AUTH_LOCKOUT_DURATION_MINUTES=30
# Password Policy
AUTH_PASSWORD_MIN_LENGTH=8
AUTH_PASSWORD_REQUIRE_UPPERCASE=true
AUTH_PASSWORD_REQUIRE_LOWERCASE=true
AUTH_PASSWORD_REQUIRE_NUMBERS=true
AUTH_PASSWORD_REQUIRE_SPECIAL_CHARS=true
```

Database

- **Development and Production**: PostgreSQL via Docker Compose
- TypeORM synchronize is enabled for development
- Seed with: `yarn --cwd apps/backend seed:dev`

Docker Setup

For production-like environment with PostgreSQL, Redis, and observability:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services included:

- **PostgreSQL**: Database (port 5432)
- **Redis**: Caching (port 6379)
- **Jaeger**: Distributed tracing UI (port 16686)
- **OTEL Collector**: OpenTelemetry data collection

API Endpoints

Security endpoints:

- `GET /api/auth/password-requirements` - Get current password policy
- `POST /api/auth/unlock-account` - Admin unlock locked accounts (requires admin role)
- `POST /api/users` - Create users with password validation (requires admin role)

Frontend setup

- yarn dev:frontend
- Open `http://localhost:5173/es`

Environment variables (frontend)

Create `apps/frontend/.env` (or `.env.local`) as needed:

```bash
VITE_API_URL=http://localhost:3000/api
```

Default users

- admin/admin123 (admin)
- prof.juana/teacher123 (teacher)
- alumno.pedro/student123 (student)

Security Features

- **Account Lockout**: Accounts are locked after 5 failed login attempts for 30 minutes
- **Password Policy**: Enforces minimum length, uppercase, lowercase, numbers, and special characters
- **Admin Unlock**: Admins can unlock locked accounts via API
- **Audit Logging**: All security events are logged for monitoring
- **IP Tracking**: Failed login attempts are tracked by IP address

Testing

- Unit tests (backend): `yarn --cwd apps/backend test`
  - Uses ts-jest; editor integration configured via root `jest.config.js`
- E2E-lite examples (supertest) included under `apps/backend/src/**/*.spec.ts`
- Lint on commit: Husky + lint-staged auto-run and block commits on errors

Local dev flow

1. Install dependencies: `yarn`
2. **Option A - SQLite (simpler)**: Start backend: `yarn dev:backend` (ensure `.env` is set); seed: `yarn --cwd apps/backend seed:dev`
3. **Option B - PostgreSQL (production-like)**: Start services: `docker-compose up -d`; start backend: `yarn dev:backend`
4. Start frontend: `yarn dev:frontend`
5. Login with default users and explore
6. Before pushing: `yarn format && yarn lint && yarn --cwd apps/backend test`
