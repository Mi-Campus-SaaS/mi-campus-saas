import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { RateLimitService, RateLimitResult } from './rate-limit.service';
import { RATE_LIMIT_KEY, RateLimitOptions, RateLimitStrategy } from './rate-limit.decorator';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse<Response>();

    const key = await this.getRateLimitKey(request, options.strategy);
    const result = await this.rateLimitService.checkRateLimit(key, options);

    this.setRateLimitHeaders(response, result, options);

    if (!result.allowed) {
      this.logger.warn(`Rate limit exceeded for ${options.strategy}: ${key}`, {
        strategy: options.strategy,
        key,
        limit: options.limit,
        windowMs: options.windowMs,
      });

      const errorResponse: {
        message: string;
        errorType: string;
        retryAfter?: string;
      } = {
        message: 'Too Many Requests',
        errorType: 'Rate limit exceeded',
      };

      if (typeof result.retryAfter === 'number') {
        const retryAfterNumber: number = result.retryAfter;
        const retryAfterString: string = String(retryAfterNumber);

        (errorResponse as { retryAfter?: string }).retryAfter = retryAfterString;
      }

      throw new HttpException(errorResponse, HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }

  private async getRateLimitKey(request: AuthenticatedRequest, strategy: RateLimitStrategy): Promise<string> {
    const routePath = (request.route as { path?: string })?.path || request.path;
    const route = `${request.method}:${routePath}`;

    switch (strategy) {
      case RateLimitStrategy.USER: {
        const user = request.user;
        if (!user?.id) {
          throw new HttpException('Authentication required for user-based rate limiting', HttpStatus.UNAUTHORIZED);
        }
        return this.rateLimitService.getUserKey(user.id, route);
      }

      case RateLimitStrategy.IP: {
        const ip = this.getClientIp(request);
        return this.rateLimitService.getIpKey(ip, route);
      }

      case RateLimitStrategy.ROUTE: {
        return this.rateLimitService.getRouteKey(route);
      }

      default: {
        const errorMessage = `Unknown rate limit strategy: ${String(strategy)}`;
        throw new Error(errorMessage);
      }
    }
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return request.ip || request.socket.remoteAddress || 'unknown';
  }

  private setRateLimitHeaders(response: Response, result: RateLimitResult, options: RateLimitOptions): void {
    response.setHeader('X-RateLimit-Limit', options.limit);
    response.setHeader('X-RateLimit-Remaining', result.remaining);
    response.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

    if (result.retryAfter !== undefined) {
      response.setHeader('Retry-After', String(result.retryAfter));
    }
  }
}
