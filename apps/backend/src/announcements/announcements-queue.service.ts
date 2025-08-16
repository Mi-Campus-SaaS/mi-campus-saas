import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue, Job } from 'bull';
import { Announcement } from './entities/announcement.entity';
import type { PublishAnnouncementJob } from './announcements.processor';

export interface JobStatus {
  status: string;
  id?: string | number;
  data?: PublishAnnouncementJob;
  progress?: number;
  attempts?: number;
  timestamp?: number;
}

@Injectable()
export class AnnouncementsQueueService {
  private readonly logger = new Logger(AnnouncementsQueueService.name);

  constructor(@InjectQueue('announcements') private readonly announcementsQueue: Queue<PublishAnnouncementJob>) {}

  async scheduleAnnouncement(announcement: Announcement): Promise<Job<PublishAnnouncementJob>> {
    const delay = announcement.publishAt.getTime() - Date.now();

    if (delay <= 0) {
      this.logger.warn(`Announcement ${announcement.id} publish time is in the past, publishing immediately`);
      return this.announcementsQueue.add('publish-scheduled', {
        announcementId: announcement.id,
        publishAt: announcement.publishAt,
      });
    }

    this.logger.log(
      `Scheduling announcement ${announcement.id} for ${announcement.publishAt.toISOString()} (${delay}ms delay)`,
    );

    return this.announcementsQueue.add(
      'publish-scheduled',
      {
        announcementId: announcement.id,
        publishAt: announcement.publishAt,
      },
      {
        delay,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );
  }

  async cancelScheduledAnnouncement(announcementId: string): Promise<boolean> {
    const jobs = await this.announcementsQueue.getJobs(['waiting', 'delayed']);
    const job = jobs.find((j) => j.data.announcementId === announcementId);

    if (job) {
      await job.remove();
      this.logger.log(`Cancelled scheduled announcement ${announcementId}`);
      return true;
    }

    this.logger.warn(`No scheduled job found for announcement ${announcementId}`);
    return false;
  }

  async getQueueMetrics() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.announcementsQueue.getWaiting(),
      this.announcementsQueue.getActive(),
      this.announcementsQueue.getCompleted(),
      this.announcementsQueue.getFailed(),
      this.announcementsQueue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      total: waiting.length + active.length + completed.length + failed.length + delayed.length,
    };
  }

  async getJobStatus(announcementId: string): Promise<JobStatus> {
    const jobs = await this.announcementsQueue.getJobs(['waiting', 'delayed', 'active', 'completed', 'failed']);
    const job = jobs.find((j) => j.data.announcementId === announcementId);

    if (!job) {
      return { status: 'not_found' };
    }

    return {
      id: job.id,
      status: await job.getState(),
      data: job.data,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      progress: job.progress(),
      attempts: job.attemptsMade,
      timestamp: job.timestamp,
    };
  }

  async clearCompletedJobs(): Promise<number> {
    const completed = await this.announcementsQueue.getCompleted();
    await this.announcementsQueue.clean(0, 'completed');
    this.logger.log(`Cleared ${completed.length} completed jobs`);
    return completed.length;
  }

  async clearFailedJobs(): Promise<number> {
    const failed = await this.announcementsQueue.getFailed();
    await this.announcementsQueue.clean(0, 'failed');
    this.logger.log(`Cleared ${failed.length} failed jobs`);
    return failed.length;
  }
}
