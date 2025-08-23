import { SetMetadata } from '@nestjs/common';
import { RateLimitConfig } from './rate-limit.service';

export const RATE_LIMIT_KEY = 'rate_limit';

export enum RateLimitStrategy {
  USER = 'user',
  IP = 'ip',
  ROUTE = 'route',
}

export interface RateLimitOptions extends RateLimitConfig {
  strategy: RateLimitStrategy;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export const RateLimit = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_KEY, options);

export const RateLimitUser = (limit: number, windowMs: number) =>
  RateLimit({
    limit,
    windowMs,
    strategy: RateLimitStrategy.USER,
  });

export const RateLimitIP = (limit: number, windowMs: number) =>
  RateLimit({
    limit,
    windowMs,
    strategy: RateLimitStrategy.IP,
  });

export const RateLimitRoute = (limit: number, windowMs: number) =>
  RateLimit({
    limit,
    windowMs,
    strategy: RateLimitStrategy.ROUTE,
  });
