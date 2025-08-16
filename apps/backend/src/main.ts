import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { HttpExceptionFilter } from './common/http-exception.filter';
import helmet from 'helmet';
import { initializeTracing } from './telemetry/tracing';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CorsService } from './common/cors.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Initialize OpenTelemetry tracing
  if (process.env.NODE_ENV !== 'test') {
    const configService = app.get(ConfigService);
    initializeTracing(configService);
  }
  // Configure Helmet with basic security headers (CSP is handled by CspMiddleware)
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      referrerPolicy: { policy: 'no-referrer' },
      frameguard: { action: 'sameorigin' },
      xssFilter: true,
      noSniff: true,
      hidePoweredBy: true,
    }),
  );
  // Configure CORS with refined policy
  const configService = app.get(ConfigService);
  const corsService = app.get(CorsService);

  if (configService.get<string>('nodeEnv') === 'development') {
    // More permissive CORS for development
    app.enableCors(corsService.createDevelopmentCorsOptions());
  } else {
    // Production CORS with allowlist and server-to-server support
    app.enableCors(corsService.createCorsOptions());
  }
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
