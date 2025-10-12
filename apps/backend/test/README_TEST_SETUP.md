# Test Database Setup

## PostgreSQL Test Database (Docker)

The API contract tests use PostgreSQL to match your production environment. Your project uses **PostgreSQL running in Docker** via `docker-compose.yml`.

### Prerequisites

1. **Docker containers must be running** (PostgreSQL on `localhost:5432`)
2. **Test database** must exist: `micampus_test`

### Quick Setup

```bash
# 1. Start Docker containers (if not running)
yarn dev:docker

# 2. Create test database
docker exec micampus-postgres psql -U postgres -c "CREATE DATABASE micampus_test;"

# 3. Run tests
yarn test:api
```

### Docker Container Info

From your `docker-compose.yml`:

- **Container**: `micampus-postgres`
- **Image**: `postgres:17`
- **User**: `postgres`
- **Password**: `postgres`
- **Port**: `5432`
- **Main DB**: `micampus`
- **Test DB**: `micampus_test` (created separately)

### Custom Configuration

You can override the default test database settings with environment variables:

```bash
# Set before running tests
export PGHOST=localhost
export PGPORT=5432
export PGUSER=postgres
export PGPASSWORD=your_password
export PGDATABASE=micampus_test
```

Or create a `.env.test` file (will be ignored by git):

```env
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_password
PGDATABASE=micampus_test
```

### Configuration File

Test database configuration is in `jest.setup.js`:

```javascript
process.env.DB_TYPE = 'postgres';
process.env.PGHOST = process.env.PGHOST || 'localhost';
process.env.PGPORT = process.env.PGPORT || '5432';
process.env.PGUSER = process.env.PGUSER || 'postgres';
process.env.PGPASSWORD = process.env.PGPASSWORD || 'postgres';
process.env.PGDATABASE = process.env.PGDATABASE || 'micampus_test';
```

### Running Tests

```bash
# Make sure PostgreSQL is running
yarn test:api
```

### Troubleshooting

#### Error: "database does not exist"

```bash
docker exec micampus-postgres psql -U postgres -c "CREATE DATABASE micampus_test;"
```

#### Error: "connection refused"

```bash
# Check if container is running
docker ps --filter "name=micampus-postgres"

# Start Docker services
yarn dev:docker

# Check PostgreSQL is ready
docker exec micampus-postgres pg_isready
```

#### Error: "authentication failed"

- Check PostgreSQL pg_hba.conf allows local connections
- Verify user/password: `psql -U postgres -d micampus_test`

#### Connection timeout

- Increase timeout in `jest.setup.js` (currently 30 seconds)
- Check PostgreSQL is accepting connections

### Test Data

Tests create and clean up their own data:

- Each test suite creates test users and entities in `beforeAll`
- Data is deleted in `afterAll` hooks
- Tests run in isolated transactions where possible

### Managing Test Database

```bash
# Create test database (only needed once)
docker exec micampus-postgres psql -U postgres -c "CREATE DATABASE micampus_test;"

# Drop and recreate (if needed)
docker exec micampus-postgres psql -U postgres -c "DROP DATABASE IF EXISTS micampus_test;"
docker exec micampus-postgres psql -U postgres -c "CREATE DATABASE micampus_test;"

# Connect to test database
docker exec -it micampus-postgres psql -U postgres -d micampus_test

# Check test database size
docker exec micampus-postgres psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('micampus_test'));"
```

### CI/CD Setup

For GitHub Actions or other CI:

```yaml
services:
  postgres:
    image: postgres:16
    env:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: micampus_test
    ports:
      - 5432:5432
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5

steps:
  - name: Run API Tests
    run: yarn test:api
    env:
      PGHOST: localhost
      PGPORT: 5432
      PGUSER: postgres
      PGPASSWORD: postgres
      PGDATABASE: micampus_test
```
