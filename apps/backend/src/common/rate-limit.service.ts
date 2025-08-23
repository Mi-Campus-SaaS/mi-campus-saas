import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
  keyPrefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_RATE_LIMIT_DB', 1),
      lazyConnect: true,
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error', error);
    });
  }

  async checkRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const keyWithPrefix = `${config.keyPrefix || 'rate_limit'}:${key}`;

    try {
      const pipeline = this.redis.pipeline();

      pipeline.zremrangebyscore(keyWithPrefix, 0, windowStart);
      pipeline.zadd(keyWithPrefix, now, `${now}-${Math.random()}`);
      pipeline.zcard(keyWithPrefix);
      pipeline.expire(keyWithPrefix, Math.ceil(config.windowMs / 1000));

      const results = await pipeline.exec();

      if (!results) {
        throw new Error('Redis pipeline execution failed');
      }

      const currentCount = results[2][1] as number;
      const remaining = Math.max(0, config.limit - currentCount);
      const allowed = currentCount < config.limit;
      const resetTime = now + config.windowMs;
      const retryAfter = allowed ? undefined : Math.ceil((resetTime - now) / 1000);

      return {
        allowed,
        remaining,
        resetTime,
        retryAfter,
      };
    } catch (redisError) {
      this.logger.error('Rate limit check failed', redisError);
      return {
        allowed: true,
        remaining: config.limit,
        resetTime: now + config.windowMs,
      };
    }
  }

  async getUserKey(userId: string, route: string): Promise<string> {
    return `user:${userId}:route:${route}`;
  }

  async getIpKey(ip: string, route: string): Promise<string> {
    return `ip:${ip}:route:${route}`;
  }

  async getRouteKey(route: string): Promise<string> {
    return `route:${route}`;
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
