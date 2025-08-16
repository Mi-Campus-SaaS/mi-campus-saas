import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { Reflector } from '@nestjs/core';
import { HttpCacheService, CacheOptions } from './http-cache.service';

export const CACHE_OPTIONS_KEY = 'cache_options';

/**
 * Decorator to enable HTTP caching on endpoints
 */
export const HttpCache = (options: CacheOptions = {}) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    Reflect.defineMetadata(CACHE_OPTIONS_KEY, options, descriptor.value);
    return descriptor;
  };
};

/**
 * Interceptor that automatically handles ETag and Last-Modified headers
 * for GET requests with the @HttpCache decorator
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly httpCacheService: HttpCacheService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Only handle GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    // Get cache options from decorator
    const cacheOptions = this.reflector.get<CacheOptions>(CACHE_OPTIONS_KEY, context.getHandler());

    // If no cache options defined, proceed normally
    if (!cacheOptions) {
      return next.handle();
    }

    // Try server-side cache first
    const endpointKey = `${request.originalUrl.split('?')[0]}`;
    const paramsKey = request.query as Record<string, any>;
    const cacheKey = this.httpCacheService.createCacheKey(endpointKey, paramsKey);

    const cached = this.httpCacheService.getCachedResponse<unknown>(cacheKey);
    if (cached !== undefined) {
      const { shouldReturn304 } = this.httpCacheService.handleConditionalRequest(
        request,
        response,
        cached as unknown,
        cacheOptions,
      );
      if (shouldReturn304) {
        this.httpCacheService.sendNotModified(response);
        return of(undefined);
      }

      return of(cached).pipe(
        tap((data) => {
          // set headers for cached response
          this.httpCacheService.handleConditionalRequest(request, response, data as unknown, cacheOptions);
        }),
      );
    }

    return next.handle().pipe(
      map((data) => {
        const { shouldReturn304 } = this.httpCacheService.handleConditionalRequest(
          request,
          response,
          data,
          cacheOptions,
        );
        if (shouldReturn304) {
          this.httpCacheService.sendNotModified(response);
          return undefined;
        }
        this.httpCacheService.setCachedResponse(cacheKey, data, cacheOptions?.maxAge);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return data;
      }),
    );
  }
}
