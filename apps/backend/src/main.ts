import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/http-exception.filter';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
          scriptSrc: ["'self'", "'unsafe-inline'"],
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
    origin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      // Allow server-to-server or tools without an origin only if explicitly configured with '*'
      if (!origin) {
        if (allowedOrigins.includes('*')) {
          callback(null, true);
        } else {
          callback(new Error('CORS: Origin not allowed'));
        }
        return;
      }
      const isAllowed = allowedOrigins.includes(origin);
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('CORS: Origin not allowed'));
      }
    },
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
