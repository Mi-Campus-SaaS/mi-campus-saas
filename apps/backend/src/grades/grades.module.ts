import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Grade } from './entities/grade.entity';
import { GpaSnapshot } from './entities/gpa-snapshot.entity';
import { GradesService } from './grades.service';
import { GradesController } from './grades.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([Grade, GpaSnapshot]), CommonModule],
  providers: [GradesService],
  controllers: [GradesController],
})
export class GradesModule {}
