import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassEntity } from './entities/class.entity';
import { ClassSession } from './entities/class-session.entity';
import { Enrollment } from './entities/enrollment.entity';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { Teacher } from '../teachers/entities/teacher.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([ClassEntity, ClassSession, Enrollment, Teacher]), CommonModule],
  providers: [ClassesService],
  controllers: [ClassesController],
  exports: [TypeOrmModule, ClassesService],
})
export class ClassesModule {}
