import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwtSecret') || process.env.JWT_SECRET,
      }),
    }),
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
