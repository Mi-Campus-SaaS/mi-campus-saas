import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const headerRequestId = req.headers['x-request-id'] ?? req.headers['x-correlation-id'];
    const requestId = Array.isArray(headerRequestId) ? headerRequestId[0] : headerRequestId || randomUUID();

    // Attach to request/response for downstream usage and client visibility
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    const startedAt = Date.now();
    // Log request start
    console.log(`[req:${requestId}] → ${req.method} ${req.originalUrl}`);

    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      console.log(`[req:${requestId}] ← ${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs}ms`);
    });

    next();
  }
}
