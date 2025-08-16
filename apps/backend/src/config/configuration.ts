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
  };
};
