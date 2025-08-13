import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Grade } from './entities/grade.entity';
import { GradesService } from './grades.service';
import { GradesController } from './grades.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([Grade]), CommonModule],
  providers: [GradesService],
  controllers: [GradesController],
})
export class GradesModule {}
