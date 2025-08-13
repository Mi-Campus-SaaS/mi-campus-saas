import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Parent } from './entities/parent.entity';
import { Student } from '../students/entities/student.entity';
import { ParentsService } from './parents.service';
import { ParentsController } from './parents.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([Parent, Student]), CommonModule],
  controllers: [ParentsController],
  providers: [ParentsService],
  exports: [TypeOrmModule],
})
export class ParentsModule {}
