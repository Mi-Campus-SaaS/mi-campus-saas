import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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

    return next.handle().pipe(
      map((data) => {
        // Handle conditional request
        const { shouldReturn304 } = this.httpCacheService.handleConditionalRequest(
          request,
          response,
          data,
          cacheOptions,
        );

        // If client cache is valid, send 304
        if (shouldReturn304) {
          this.httpCacheService.sendNotModified(response);
          return; // Response will be sent as 304
        }

        // Return data normally with cache headers set
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return data;
      }),
    );
  }
}
