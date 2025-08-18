// Jest setup file - provides required environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-that-is-long-enough-for-validation-32-chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-long-enough-for-validation-32-chars';
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = ':memory:'; // Use in-memory SQLite for tests
process.env.DB_TYPE = 'sqlite'; // Force SQLite during tests, regardless of .env
delete process.env.DATABASE_URL; // Ensure URL does not force Postgres
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.UPLOAD_DIR = 'test-uploads';
process.env.OTEL_ENABLED = 'false';
process.env.SMTP_HOST = 'localhost';
process.env.SMTP_PORT = '1025';
process.env.SMTP_SECURE = 'false';
process.env.SMTP_USER = 'test-user';
process.env.SMTP_PASS = 'test-password';
process.env.SMTP_FROM = 'test@example.com';
