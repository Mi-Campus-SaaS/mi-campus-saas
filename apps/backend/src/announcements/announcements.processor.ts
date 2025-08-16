import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { AnnouncementsService } from './announcements.service';

export interface PublishAnnouncementJob {
  announcementId: string;
  publishAt: Date;
}

@Processor('announcements')
export class AnnouncementsProcessor {
  private readonly logger = new Logger(AnnouncementsProcessor.name);

  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Process('publish-scheduled')
  async handlePublishScheduled(job: Job<PublishAnnouncementJob>) {
    const { announcementId, publishAt } = job.data;

    this.logger.log(`Processing scheduled announcement ${announcementId} for ${publishAt.toISOString()}`);

    try {
      const announcement = await this.announcementsService.findById(announcementId);

      if (!announcement) {
        this.logger.warn(`Announcement ${announcementId} not found, removing job`);
        return { status: 'not_found' };
      }

      if (announcement.publishAt > new Date()) {
        this.logger.warn(`Announcement ${announcementId} publish time not reached yet`);
        return { status: 'too_early' };
      }

      this.logger.log(`Publishing announcement ${announcementId}: ${announcement.content.substring(0, 50)}...`);

      // Here you would implement the actual publishing logic
      // For now, we'll just log it as published
      await this.announcementsService.update(announcementId, {
        publishAt: new Date(), // Mark as published now
      });

      this.logger.log(`Successfully published announcement ${announcementId}`);

      return {
        status: 'published',
        announcementId,
        publishedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to publish announcement ${announcementId}:`, error);
      throw error; // This will trigger retry
    }
  }
}
