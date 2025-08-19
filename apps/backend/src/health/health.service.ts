import { Injectable, Optional } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';
import type { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { StorageService } from '../common/storage/storage.service';

@Injectable()
export class HealthService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly storageService: StorageService,
    @Optional() @InjectQueue('announcements') private readonly announcementsQueue?: Queue,
  ) {}

  async checkReadiness(): Promise<{
    status: 'ok' | 'degraded' | 'error';
    checks: { db: boolean; redis: boolean; storage: boolean };
  }> {
    const checks = { db: false, redis: false, storage: false };

    // DB check: simple query
    try {
      await this.dataSource.query('SELECT 1');
      checks.db = true;
    } catch {
      checks.db = false;
    }

    // Redis/Queue check: if queue is configured (non-test), try a lightweight command
    try {
      if (this.announcementsQueue) {
        await this.assertQueueHealthy(this.announcementsQueue);
        checks.redis = true;
      } else {
        // In test or when queue not configured (e.g., no Redis), mark as true if not required
        checks.redis = process.env.NODE_ENV === 'test' || !process.env.REDIS_HOST;
      }
    } catch {
      checks.redis = false;
    }

    // Storage check
    try {
      checks.storage = await this.storageService.isReady();
    } catch {
      checks.storage = false;
    }

    let status: 'ok' | 'degraded' | 'error';
    if (checks.db && checks.storage && checks.redis) {
      status = 'ok';
    } else if (checks.db) {
      status = 'degraded';
    } else {
      status = 'error';
    }

    return { status, checks };
  }

  private async assertQueueHealthy(queue: Queue): Promise<void> {
    // Use getJobCounts() as a lightweight Redis interaction with a short timeout
    const op = queue.getJobCounts();
    await this.withTimeout(op, 1000);
  }

  private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timeoutId: NodeJS.Timeout | undefined;
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('timeout')), ms);
      });
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }
}
