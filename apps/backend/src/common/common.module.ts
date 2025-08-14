import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OwnershipGuard } from './ownership.guard';
import { AuditLogger } from './audit.logger';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { Enrollment } from '../classes/entities/enrollment.entity';
import { FeeInvoice } from '../finance/entities/fee.entity';
import { Parent } from '../parents/entities/parent.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Student, Teacher, ClassEntity, Enrollment, FeeInvoice, Parent])],
  providers: [OwnershipGuard, AuditLogger],
  exports: [OwnershipGuard, AuditLogger],
})
export class CommonModule {}
