import { Process, Processor } from '@nestjs/bull';
import { Logger, NotFoundException } from '@nestjs/common';
import type { Job } from 'bull';
import { AnnouncementsService } from './announcements.service';
import { runWithBullJobSpan } from '../telemetry/queue-tracing';

export interface PublishAnnouncementJob {
  announcementId: string;
  publishAt: string; // ISO string - Bull serializes to JSON, so Date becomes string
  __otel?: Record<string, string>;
}

@Processor('announcements')
export class AnnouncementsProcessor {
  private readonly logger = new Logger(AnnouncementsProcessor.name);

  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Process('publish-scheduled')
  async handlePublishScheduled(job: Job<PublishAnnouncementJob>) {
    return runWithBullJobSpan({
      queueName: 'announcements',
      jobName: job.name,
      jobId: job.id,
      jobData: job.data,
      operation: 'process',
      fn: async () => {
        const { announcementId, publishAt: publishAtStr } = job.data;
        const publishAt = new Date(publishAtStr);

        this.logger.log(`Processing scheduled announcement ${announcementId} for ${publishAt.toISOString()}`);

        try {
          const announcement = await this.announcementsService.findById(announcementId);

          const announcementPublishAt = new Date(announcement.publishAt);
          const now = new Date();
          if (announcementPublishAt > now) {
            const delayMs = announcementPublishAt.getTime() - now.getTime();
            this.logger.warn(
              `Announcement ${announcementId} publish time not reached, throwing to retry in ${delayMs}ms`,
            );
            throw new Error(`Publish time not reached, retry after ${delayMs}ms`);
          }

          this.logger.log(`Publishing announcement ${announcementId}: ${announcement.content.substring(0, 50)}...`);

          const publishedAt = new Date();
          await this.announcementsService.update(announcementId, {
            publishedAt, // Track when it was actually published, preserve original publishAt
          });

          this.logger.log(`Successfully published announcement ${announcementId}`);

          return {
            status: 'published',
            announcementId,
            publishedAt,
          };
        } catch (error) {
          if (error instanceof NotFoundException) {
            this.logger.warn(`Announcement ${announcementId} not found, removing job`);
            return { status: 'not_found' };
          }
          this.logger.error(`Failed to publish announcement ${announcementId}:`, error);
          throw error; // This will trigger retry
        }
      },
    });
  }
}
