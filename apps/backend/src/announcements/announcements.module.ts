import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Announcement } from './entities/announcement.entity';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsProcessor } from './announcements.processor';
import { AnnouncementsQueueService } from './announcements-queue.service';
import { AnnouncementsSchedulerService } from './announcements-scheduler.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Announcement]),
    CommonModule,
    ...(process.env.NODE_ENV !== 'test'
      ? [
          BullModule.registerQueue({
            name: 'announcements',
          }),
        ]
      : []),
  ],
  providers: [
    AnnouncementsService,
    ...(process.env.NODE_ENV !== 'test'
      ? [AnnouncementsProcessor, AnnouncementsQueueService, AnnouncementsSchedulerService]
      : []),
  ],
  controllers: [AnnouncementsController],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
