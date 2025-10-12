// Jest setup file - provides required environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-that-is-long-enough-for-validation-32-chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-long-enough-for-validation-32-chars';
process.env.NODE_ENV = 'test';

// Use PostgreSQL for tests (matches production environment)
process.env.DB_TYPE = 'postgres';
process.env.PGHOST = process.env.PGHOST || 'localhost';
process.env.PGPORT = process.env.PGPORT || '5432';
process.env.PGUSER = process.env.PGUSER || 'postgres';
process.env.PGPASSWORD = process.env.PGPASSWORD || 'postgres';
process.env.PGDATABASE = process.env.PGDATABASE || 'micampus_test_e2e';
delete process.env.DATABASE_URL;
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.UPLOAD_DIR = 'test-uploads';
process.env.OTEL_ENABLED = 'false';
process.env.SMTP_HOST = 'localhost';
process.env.SMTP_PORT = '1025';
process.env.SMTP_SECURE = 'false';
process.env.SMTP_USER = 'test-user';
process.env.SMTP_PASS = 'test-password';
process.env.SMTP_FROM = 'test@example.com';

// Set timeout for tests (database operations may take longer)
jest.setTimeout(30000);
