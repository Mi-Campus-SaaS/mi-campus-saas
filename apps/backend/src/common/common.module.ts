import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OwnershipGuard } from './ownership.guard';
import { AuditLogger } from './audit.logger';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { Enrollment } from '../classes/entities/enrollment.entity';
import { FeeInvoice } from '../finance/entities/fee.entity';
import { Parent } from '../parents/entities/parent.entity';
import { InMemoryCacheService } from './cache.service';
import { CspService } from './csp.service';
import { CspMiddleware } from './csp.middleware';
import { CorsService } from './cors.service';
import { HttpCacheService } from './http-cache.service';
import { CacheInterceptor } from './cache.interceptor';
import { StorageService } from './storage/storage.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Student, Teacher, ClassEntity, Enrollment, FeeInvoice, Parent])],
  providers: [
    OwnershipGuard,
    AuditLogger,
    InMemoryCacheService,
    CspService,
    CspMiddleware,
    CorsService,
    HttpCacheService,
    CacheInterceptor,
    StorageService,
  ],
  exports: [
    OwnershipGuard,
    AuditLogger,
    InMemoryCacheService,
    CspService,
    CorsService,
    HttpCacheService,
    CacheInterceptor,
    StorageService,
  ],
})
export class CommonModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CspMiddleware).forRoutes('*');
  }
}
