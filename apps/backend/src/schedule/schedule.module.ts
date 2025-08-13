import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassSession } from '../classes/entities/class-session.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([ClassSession, ClassEntity]), CommonModule],
  providers: [ScheduleService],
  controllers: [ScheduleController],
})
export class ScheduleModule {}
