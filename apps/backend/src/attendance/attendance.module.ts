import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from './entities/attendance.entity';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { Student } from '../students/entities/student.entity';
import { ClassEntity } from '../classes/entities/class.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Attendance, Student, ClassEntity])],
  providers: [AttendanceService],
  controllers: [AttendanceController],
})
export class AttendanceModule {}
