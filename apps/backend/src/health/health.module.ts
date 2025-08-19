import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { CommonModule } from '../common/common.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    TypeOrmModule.forFeature([]),
    CommonModule,
    ...(process.env.NODE_ENV !== 'test' ? [BullModule.registerQueue({ name: 'announcements' })] : []),
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
