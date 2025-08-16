import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([Student]), CommonModule],
  providers: [StudentsService],
  controllers: [StudentsController],
  exports: [TypeOrmModule, StudentsService],
})
export class StudentsModule {}
