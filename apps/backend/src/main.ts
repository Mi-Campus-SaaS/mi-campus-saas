import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { HttpExceptionFilter } from './common/http-exception.filter';
import helmet from 'helmet';
import { initializeTracing } from './telemetry/tracing';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Initialize OpenTelemetry tracing
  if (process.env.NODE_ENV !== 'test') {
    const configService = app.get(ConfigService);
    initializeTracing(configService);
  }
  // CORS allowlist from env (comma-separated). Fallback to FRONTEND_URL for backward compatibility
  const allowlistEnv = process.env.CORS_ALLOWLIST || process.env.FRONTEND_URL || 'http://localhost:5173';
  const allowedOrigins = allowlistEnv
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'", ...allowedOrigins],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          frameAncestors: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      referrerPolicy: { policy: 'no-referrer' },
      frameguard: { action: 'sameorigin' },
      xssFilter: true,
      noSniff: true,
      hidePoweredBy: true,
    }),
  );
  app.enableCors({
    origin: true, // Allow all origins for development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.setGlobalPrefix('api');

  // OpenAPI/Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('MI Campus API')
    .setDescription('API documentation for MI Campus management system')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('students', 'Student management')
    .addTag('teachers', 'Teacher management')
    .addTag('grades', 'Grade management')
    .addTag('attendance', 'Attendance tracking')
    .addTag('materials', 'Educational materials')
    .addTag('announcements', 'Announcements')
    .addTag('finance', 'Financial management')
    .addTag('schedule', 'Schedule management')
    .addTag('classes', 'Class management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'MI Campus API Documentation',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors: import('class-validator').ValidationError[]) => {
        const i18n = I18nContext.current();
        const langMessage = i18n?.t('validation.required') ?? 'Validation error';
        const details = errors.map(
          (e) => `${e.property}: ${(e.constraints && Object.values(e.constraints).join(', ')) || 'invalid'}`,
        );
        return new BadRequestException({ message: langMessage, details });
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
