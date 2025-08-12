import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const startedAt = Date.now();
    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      // Simple dev logger
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs}ms`);
    });
    next();
  }
}

