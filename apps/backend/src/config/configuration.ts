export interface AppConfig {
  nodeEnv: string;
  port: number;
  frontendUrl: string;
  databasePath: string;
  jwtSecret: string;
  jwtExpiresIn: string; // legacy access expiry support
  jwtAccessExpiresIn: string;
  jwtRefreshSecret: string;
  jwtRefreshExpiresIn: string;
  uploadDir: string;
  otel: {
    enabled: boolean;
    endpoint: string;
    serviceName: string;
    serviceVersion: string;
  };
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user?: string;
    pass?: string;
    from: string;
  };
}

export const loadConfiguration = (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  databasePath: process.env.DATABASE_PATH || './data/dev.sqlite',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  otel: {
    enabled: (process.env.OTEL_ENABLED || 'true') === 'true',
    endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    serviceName: process.env.OTEL_SERVICE_NAME || 'mi-campus-backend',
    serviceVersion: process.env.OTEL_SERVICE_VERSION || process.env.npm_package_version || '1.0.0',
  },
  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '1025', 10),
    secure: (process.env.SMTP_SECURE || 'false') === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'Mi Campus <noreply@micampus.local>',
  },
});
