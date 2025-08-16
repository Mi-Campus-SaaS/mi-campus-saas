import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { loadConfiguration } from './config/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createTypeOrmConfig } from './database/typeorm.config';
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
import { join } from 'path';
import { LoggingMiddleware } from './common/logging.middleware';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

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
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), process.env.UPLOAD_DIR || 'uploads'),
      serveRoot: '/files',
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'es',
      loaderOptions: { path: join(__dirname, '..', 'i18n'), watch: true },
      resolvers: [{ use: QueryResolver, options: ['lang'] }, HeaderResolver, AcceptLanguageResolver],
    }),
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
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes({ path: '/*path', method: RequestMethod.ALL });
  }
}
