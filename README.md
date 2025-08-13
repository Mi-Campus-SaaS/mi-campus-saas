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

```
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
```

Database

- SQLite file at `./apps/backend/data/dev.sqlite` (relative to repo root) by default
- TypeORM synchronize is enabled for development
- Seed with: `yarn --cwd apps/backend seed:dev`

Frontend setup

- yarn dev:frontend
- Open `http://localhost:5173/es`

Environment variables (frontend)

Create `apps/frontend/.env` (or `.env.local`) as needed:

```
VITE_API_URL=http://localhost:3000/api
```

Default users

- admin/admin123 (admin)
- prof.juana/teacher123 (teacher)
- alumno.pedro/student123 (student)

Testing

- Unit tests (backend): `yarn --cwd apps/backend test`
  - Uses ts-jest; editor integration configured via root `jest.config.js`
- E2E-lite examples (supertest) included under `apps/backend/src/**/*.spec.ts`
- Lint on commit: Husky + lint-staged auto-run and block commits on errors

Local dev flow

1. Install dependencies: `yarn`
2. Start backend: `yarn dev:backend` (ensure `.env` is set); seed: `yarn --cwd apps/backend seed:dev`
3. Start frontend: `yarn dev:frontend`
4. Login with default users and explore
5. Before pushing: `yarn format && yarn lint && yarn --cwd apps/backend test`
