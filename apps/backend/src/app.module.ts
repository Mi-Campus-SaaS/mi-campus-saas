import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { loadConfiguration } from './config/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createTypeOrmConfig } from './database/typeorm.config';
import { BullModule } from '@nestjs/bull';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { TeachersModule } from './teachers/teachers.module';
import { GradesModule } from './grades/grades.module';
import { AttendanceModule } from './attendance/attendance.module';
import { MaterialsModule } from './materials/materials.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { FinanceModule } from './finance/finance.module';
import { ScheduleModule } from './schedule/schedule.module';
import { ClassesModule } from './classes/classes.module';
import { ParentsModule } from './parents/parents.module';
import { I18nModule, AcceptLanguageResolver, QueryResolver, HeaderResolver } from 'nestjs-i18n';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { LoggingMiddleware } from './common/logging.middleware';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { TelemetryModule } from './telemetry/telemetry.module';
import { AuditModule } from './audit/audit.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [loadConfiguration] }),

    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: Number.parseInt(process.env.THROTTLE_TTL_SECONDS ?? '60', 10),
          limit: Number.parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
        },
      ],
    }),
    TypeOrmModule.forRootAsync({ useFactory: createTypeOrmConfig }),
    ...(process.env.NODE_ENV === 'test'
      ? []
      : [
          BullModule.forRoot({
            redis: {
              host: process.env.REDIS_HOST || 'localhost',
              port: Number.parseInt(process.env.REDIS_PORT || '6379', 10),
              password: process.env.REDIS_PASSWORD,
              db: Number.parseInt(process.env.REDIS_DB || '0', 10),
            },
          }),
        ]),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), process.env.UPLOAD_DIR || 'uploads'),
      serveRoot: '/files',
    }),
    ...(process.env.NODE_ENV === 'test'
      ? [
          I18nModule.forRoot({
            fallbackLanguage: 'es',
            loaderOptions: {
              path: join(__dirname, 'i18n'),
            },
            resolvers: [{ use: QueryResolver, options: ['lang'] }, HeaderResolver, AcceptLanguageResolver],
            skipAsyncHook: true,
          }),
        ]
      : [
          I18nModule.forRoot({
            fallbackLanguage: 'es',
            loaderOptions: {
              // nest-cli.json copies i18n to dist/i18n/
              // When running compiled code, __dirname is dist/src/, so go up one level to dist/i18n
              // Fall back to src/i18n if dist/i18n doesn't exist (development/watch mode)
              path: (() => {
                // Use resolve to get absolute paths
                const distPath = resolve(__dirname, '..', 'i18n');
                const srcPath = resolve(process.cwd(), 'apps', 'backend', 'src', 'i18n');
                return existsSync(distPath) ? distPath : srcPath;
              })(),
              watch: process.env.NODE_ENV === 'development',
            },
            resolvers: [{ use: QueryResolver, options: ['lang'] }, HeaderResolver, AcceptLanguageResolver],
          }),
        ]),
    UsersModule,
    AuthModule,
    StudentsModule,
    TeachersModule,
    GradesModule,
    AttendanceModule,
    MaterialsModule,
    AnnouncementsModule,
    FinanceModule,
    ScheduleModule,
    ClassesModule,
    ParentsModule,
    TelemetryModule,
    AuditModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
