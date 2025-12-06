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
import { join } from 'node:path';
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
      ? []
      : [
          I18nModule.forRoot({
            fallbackLanguage: 'es',
            loaderOptions: {
              // In production: compiled code is in dist/src/, i18n is copied to dist/i18n/
              // In development: code is in src/, i18n is in src/i18n/
              // Use __dirname which points to dist/src/ in production or src/ in development
              path: __dirname.includes('dist')
                ? join(__dirname, '..', 'i18n') // Production: dist/src -> dist/i18n
                : join(__dirname, 'i18n'), // Development: src -> src/i18n
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
