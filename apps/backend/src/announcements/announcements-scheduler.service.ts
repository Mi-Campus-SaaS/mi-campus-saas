import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from './entities/announcement.entity';
import { AnnouncementsQueueService } from './announcements-queue.service';

@Injectable()
export class AnnouncementsSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(AnnouncementsSchedulerService.name);

  constructor(
    @InjectRepository(Announcement)
    private readonly announcementsRepo: Repository<Announcement>,
    private readonly queueService: AnnouncementsQueueService,
  ) {}

  async onModuleInit() {
    await this.scheduleExistingAnnouncements();
  }

  private async scheduleExistingAnnouncements() {
    try {
      const now = new Date();
      const futureAnnouncements = await this.announcementsRepo
        .createQueryBuilder('announcement')
        .where('announcement.publishAt > :now', { now })
        .getMany();

      this.logger.log(`Found ${futureAnnouncements.length} announcements to schedule`);

      for (const announcement of futureAnnouncements) {
        try {
          await this.queueService.scheduleAnnouncement(announcement);
          this.logger.log(`Scheduled announcement ${announcement.id} for ${announcement.publishAt.toISOString()}`);
        } catch (error) {
          this.logger.error(`Failed to schedule announcement ${announcement.id}:`, error);
        }
      }

      this.logger.log('Finished scheduling existing announcements');
    } catch (error) {
      this.logger.error('Failed to schedule existing announcements:', error);
    }
  }
}
