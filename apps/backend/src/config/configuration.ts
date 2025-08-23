import * as Joi from 'joi';

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
  httpCacheTtlSeconds: number;
  cors: {
    allowlist: string;
    allowServerToServer: boolean;
  };
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
  auth: {
    maxFailedAttempts: number;
    lockoutDurationMinutes: number;
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
    };
  };
  rateLimit: {
    enabled: boolean;
    defaultLimit: number;
    defaultWindowMs: number;
    userLimit: number;
    userWindowMs: number;
    ipLimit: number;
    ipWindowMs: number;
    routeLimit: number;
    routeWindowMs: number;
  };
}

const configSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3000),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:5173'),
  DATABASE_PATH: Joi.string().default('./data/dev.sqlite'),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string()
    .pattern(/^\d+[mhd]$/)
    .default('15m'),
  JWT_ACCESS_EXPIRES_IN: Joi.string()
    .pattern(/^\d+[mhd]$/)
    .default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string()
    .pattern(/^\d+[mhd]$/)
    .default('7d'),
  UPLOAD_DIR: Joi.string().default('uploads'),
  HTTP_CACHE_TTL_SECONDS: Joi.number().integer().min(1).max(86400).default(300),
  OTEL_ENABLED: Joi.boolean().default(true),
  OTEL_EXPORTER_OTLP_ENDPOINT: Joi.string().uri().default('http://localhost:4318/v1/traces'),
  OTEL_SERVICE_NAME: Joi.string().default('mi-campus-backend'),
  OTEL_SERVICE_VERSION: Joi.string().default('1.0.0'),
  SMTP_HOST: Joi.string().hostname().default('localhost'),
  SMTP_PORT: Joi.number().port().default(1025),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASS: Joi.string().optional(),
  SMTP_FROM: Joi.string().email().default('Mi Campus <noreply@micampus.local>'),
  CORS_ALLOWLIST: Joi.string().default('http://localhost:5173,http://localhost:8080'),
  CORS_ALLOW_SERVER_TO_SERVER: Joi.boolean().default(false),
  AUTH_THROTTLE_LIMIT: Joi.number().integer().min(1).max(100).default(5),
  AUTH_THROTTLE_TTL_SECONDS: Joi.number().integer().min(1).max(3600).default(60),
  AUTH_MAX_FAILED_ATTEMPTS: Joi.number().integer().min(1).max(10).default(5),
  AUTH_LOCKOUT_DURATION_MINUTES: Joi.number().integer().min(1).max(1440).default(30),
  AUTH_PASSWORD_MIN_LENGTH: Joi.number().integer().min(6).max(128).default(8),
  AUTH_PASSWORD_REQUIRE_UPPERCASE: Joi.boolean().default(true),
  AUTH_PASSWORD_REQUIRE_LOWERCASE: Joi.boolean().default(true),
  AUTH_PASSWORD_REQUIRE_NUMBERS: Joi.boolean().default(true),
  AUTH_PASSWORD_REQUIRE_SPECIAL_CHARS: Joi.boolean().default(true),
  RATE_LIMIT_ENABLED: Joi.boolean().default(true),
  RATE_LIMIT_DEFAULT_LIMIT: Joi.number().integer().min(1).max(1000).default(100),
  RATE_LIMIT_DEFAULT_WINDOW_MS: Joi.number().integer().min(1000).max(3600000).default(60000),
  RATE_LIMIT_USER_LIMIT: Joi.number().integer().min(1).max(1000).default(200),
  RATE_LIMIT_USER_WINDOW_MS: Joi.number().integer().min(1000).max(3600000).default(60000),
  RATE_LIMIT_IP_LIMIT: Joi.number().integer().min(1).max(1000).default(150),
  RATE_LIMIT_IP_WINDOW_MS: Joi.number().integer().min(1000).max(3600000).default(60000),
  RATE_LIMIT_ROUTE_LIMIT: Joi.number().integer().min(1).max(1000).default(300),
  RATE_LIMIT_ROUTE_WINDOW_MS: Joi.number().integer().min(1000).max(3600000).default(60000),
});

interface ValidatedConfig {
  NODE_ENV: string;
  PORT: number;
  FRONTEND_URL: string;
  DATABASE_PATH: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
  UPLOAD_DIR: string;
  OTEL_ENABLED: boolean;
  OTEL_EXPORTER_OTLP_ENDPOINT: string;
  OTEL_SERVICE_NAME: string;
  OTEL_SERVICE_VERSION: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM: string;
  CORS_ALLOWLIST?: string;
  CORS_ALLOW_SERVER_TO_SERVER?: boolean;
  HTTP_CACHE_TTL_SECONDS: number;
  AUTH_MAX_FAILED_ATTEMPTS: number;
  AUTH_LOCKOUT_DURATION_MINUTES: number;
  AUTH_PASSWORD_MIN_LENGTH: number;
  AUTH_PASSWORD_REQUIRE_UPPERCASE: boolean;
  AUTH_PASSWORD_REQUIRE_LOWERCASE: boolean;
  AUTH_PASSWORD_REQUIRE_NUMBERS: boolean;
  AUTH_PASSWORD_REQUIRE_SPECIAL_CHARS: boolean;
  RATE_LIMIT_ENABLED: boolean;
  RATE_LIMIT_DEFAULT_LIMIT: number;
  RATE_LIMIT_DEFAULT_WINDOW_MS: number;
  RATE_LIMIT_USER_LIMIT: number;
  RATE_LIMIT_USER_WINDOW_MS: number;
  RATE_LIMIT_IP_LIMIT: number;
  RATE_LIMIT_IP_WINDOW_MS: number;
  RATE_LIMIT_ROUTE_LIMIT: number;
  RATE_LIMIT_ROUTE_WINDOW_MS: number;
}

export const loadConfiguration = (): AppConfig => {
  const result = configSchema.validate(process.env, {
    allowUnknown: true,
    abortEarly: false,
  });

  if (result.error) {
    const errorMessage = `Configuration validation failed:\n${result.error.details
      .map((detail) => `  - ${detail.message}`)
      .join('\n')}`;
    throw new Error(errorMessage);
  }

  const validatedConfig = result.value as ValidatedConfig;

  return {
    nodeEnv: validatedConfig.NODE_ENV,
    port: validatedConfig.PORT,
    frontendUrl: validatedConfig.FRONTEND_URL,
    databasePath: validatedConfig.DATABASE_PATH,
    jwtSecret: validatedConfig.JWT_SECRET,
    jwtExpiresIn: validatedConfig.JWT_EXPIRES_IN,
    jwtAccessExpiresIn: validatedConfig.JWT_ACCESS_EXPIRES_IN,
    jwtRefreshSecret: validatedConfig.JWT_REFRESH_SECRET,
    jwtRefreshExpiresIn: validatedConfig.JWT_REFRESH_EXPIRES_IN,
    uploadDir: validatedConfig.UPLOAD_DIR,
    httpCacheTtlSeconds: validatedConfig.HTTP_CACHE_TTL_SECONDS,
    otel: {
      enabled: validatedConfig.OTEL_ENABLED,
      endpoint: validatedConfig.OTEL_EXPORTER_OTLP_ENDPOINT,
      serviceName: validatedConfig.OTEL_SERVICE_NAME,
      serviceVersion: validatedConfig.OTEL_SERVICE_VERSION,
    },
    cors: {
      allowlist: validatedConfig.CORS_ALLOWLIST || 'http://localhost:5173,http://localhost:8080',
      allowServerToServer: validatedConfig.CORS_ALLOW_SERVER_TO_SERVER || false,
    },
    smtp: {
      host: validatedConfig.SMTP_HOST,
      port: validatedConfig.SMTP_PORT,
      secure: validatedConfig.SMTP_SECURE,
      user: validatedConfig.SMTP_USER,
      pass: validatedConfig.SMTP_PASS,
      from: validatedConfig.SMTP_FROM,
    },
    auth: {
      maxFailedAttempts: validatedConfig.AUTH_MAX_FAILED_ATTEMPTS,
      lockoutDurationMinutes: validatedConfig.AUTH_LOCKOUT_DURATION_MINUTES,
      passwordPolicy: {
        minLength: validatedConfig.AUTH_PASSWORD_MIN_LENGTH,
        requireUppercase: validatedConfig.AUTH_PASSWORD_REQUIRE_UPPERCASE,
        requireLowercase: validatedConfig.AUTH_PASSWORD_REQUIRE_LOWERCASE,
        requireNumbers: validatedConfig.AUTH_PASSWORD_REQUIRE_NUMBERS,
        requireSpecialChars: validatedConfig.AUTH_PASSWORD_REQUIRE_SPECIAL_CHARS,
      },
    },
    rateLimit: {
      enabled: validatedConfig.RATE_LIMIT_ENABLED,
      defaultLimit: validatedConfig.RATE_LIMIT_DEFAULT_LIMIT,
      defaultWindowMs: validatedConfig.RATE_LIMIT_DEFAULT_WINDOW_MS,
      userLimit: validatedConfig.RATE_LIMIT_USER_LIMIT,
      userWindowMs: validatedConfig.RATE_LIMIT_USER_WINDOW_MS,
      ipLimit: validatedConfig.RATE_LIMIT_IP_LIMIT,
      ipWindowMs: validatedConfig.RATE_LIMIT_IP_WINDOW_MS,
      routeLimit: validatedConfig.RATE_LIMIT_ROUTE_LIMIT,
      routeWindowMs: validatedConfig.RATE_LIMIT_ROUTE_WINDOW_MS,
    },
  };
};
