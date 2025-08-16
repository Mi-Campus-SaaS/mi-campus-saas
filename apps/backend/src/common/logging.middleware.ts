import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { TracingService } from '../telemetry/tracing.service';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly tracingService: TracingService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const headerRequestId = req.headers['x-request-id'] ?? req.headers['x-correlation-id'];
    const requestId = Array.isArray(headerRequestId) ? headerRequestId[0] : headerRequestId || randomUUID();

    // Extract trace context from request headers
    this.tracingService.extractTraceFromRequest(req);

    // Attach to request/response for downstream usage and client visibility
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    // Add trace context to response headers
    const traceId = this.tracingService.getTraceId();
    const spanId = this.tracingService.getSpanId();
    if (traceId) {
      res.setHeader('X-Trace-Id', traceId);
    }
    if (spanId) {
      res.setHeader('X-Span-Id', spanId);
    }

    // Set span attributes for the request
    this.tracingService.setAttributes({
      'http.request_id': requestId,
      'http.method': req.method,
      'http.url': req.originalUrl,
      'http.user_agent': req.get('User-Agent'),
      'http.client_ip': req.ip || req.connection.remoteAddress,
    });

    const startedAt = Date.now();
    console.log(`[req:${requestId}] → ${req.method} ${req.originalUrl}`);

    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;

      // Update span with response information
      this.tracingService.setAttributes({
        'http.status_code': res.statusCode,
        'http.response_time_ms': durationMs,
      });

      this.tracingService.addEvent('http.response', {
        status_code: res.statusCode,
        duration_ms: durationMs,
      });

      console.log(`[req:${requestId}] ← ${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs}ms`);
    });

    next();
  }
}
