import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Announcement } from './entities/announcement.entity';
import { AnnouncementsQueueService, type JobStatus } from './announcements-queue.service';
import { PaginationQueryDto, PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement)
    private readonly announcementsRepo: Repository<Announcement>,
    @Optional() private readonly queueService?: AnnouncementsQueueService,
  ) {}

  async create(data: Partial<Announcement>) {
    const entity = this.announcementsRepo.create(data);
    const saved = await this.announcementsRepo.save(entity);

    // Schedule the announcement if it has a future publish date
    if (saved.publishAt > new Date() && this.queueService) {
      await this.queueService.scheduleAnnouncement(saved);
    }

    return saved;
  }

  async findById(id: string): Promise<Announcement> {
    const found = await this.announcementsRepo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Announcement not found');
    return found;
  }

  async list(query: PaginationQueryDto): Promise<PaginatedResponse<Announcement>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = query.q ? { content: Like(`%${query.q}%`) } : {};
    const [rows, total] = await this.announcementsRepo.findAndCount({
      where,
      order: { publishAt: (query.sortDir ?? 'desc').toUpperCase() as 'ASC' | 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
    return { data: rows, total, page, limit };
  }

  async update(id: string, data: Partial<Announcement>) {
    const existing = await this.findById(id);
    const oldPublishAt = existing.publishAt;
    Object.assign(existing, data);
    const updated = await this.announcementsRepo.save(existing);

    // Handle scheduling changes
    if (data.publishAt && data.publishAt !== oldPublishAt && this.queueService) {
      await this.queueService.cancelScheduledAnnouncement(id);
      if (updated.publishAt > new Date()) {
        await this.queueService.scheduleAnnouncement(updated);
      }
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findById(id);
    if (this.queueService) {
      await this.queueService.cancelScheduledAnnouncement(id);
    }
    await this.announcementsRepo.softRemove(existing);
  }

  async getQueueMetrics() {
    if (!this.queueService) {
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        total: 0,
      };
    }
    return this.queueService.getQueueMetrics();
  }

  async getJobStatus(announcementId: string): Promise<JobStatus> {
    if (!this.queueService) {
      return { status: 'not_available' };
    }
    return this.queueService.getJobStatus(announcementId);
  }

  async clearCompletedJobs(): Promise<number> {
    if (!this.queueService) {
      return 0;
    }
    return this.queueService.clearCompletedJobs();
  }

  async clearFailedJobs(): Promise<number> {
    if (!this.queueService) {
      return 0;
    }
    return this.queueService.clearFailedJobs();
  }
}
