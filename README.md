Mi Campus SaaS (Monorepo)

Commands

- yarn dev: runs frontend (Vite) and backend (NestJS) together
- yarn dev:frontend: start Vite
- yarn dev:backend: start Nest in watch mode
- yarn build: build both apps

Backend setup

- Copy `apps/backend/.env.example` to `apps/backend/.env`
- yarn dev:backend
- Seed data: `yarn --cwd apps/backend seed:dev` (creates admin/teacher/student users)

Frontend setup

- yarn dev:frontend
- Open `http://localhost:5173/es`

Default users

- admin/admin123 (admin)
- prof.juana/teacher123 (teacher)
- alumno.pedro/student123 (student)

