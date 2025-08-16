import { Module, MiddlewareConsumer } from '@nestjs/common';
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

@Module({
  imports: [TypeOrmModule.forFeature([Student, Teacher, ClassEntity, Enrollment, FeeInvoice, Parent])],
  providers: [OwnershipGuard, AuditLogger, InMemoryCacheService, CspService, CspMiddleware],
  exports: [OwnershipGuard, AuditLogger, InMemoryCacheService, CspService],
})
export class CommonModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CspMiddleware).forRoutes('*');
  }
}
