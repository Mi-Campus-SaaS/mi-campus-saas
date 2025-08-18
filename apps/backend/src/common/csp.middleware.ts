import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import { CspService } from './csp.service';

export interface RequestWithNonce extends Request {
  nonce?: string;
}

@Injectable()
export class CspMiddleware implements NestMiddleware {
  constructor(private readonly cspService: CspService) {}

  use(req: RequestWithNonce, res: Response, next: NextFunction) {
    // Generate a unique nonce for this request
    const nonce = randomBytes(16).toString('base64');
    req.nonce = nonce;

    // Add nonce to response headers for potential use by the frontend
    res.setHeader('X-CSP-Nonce', nonce);

    // Generate CSP directives
    const allowedOrigins = this.getAllowedOrigins();
    const directives = this.cspService.generateCspDirectives(req, allowedOrigins);

    // Convert directives to CSP header format
    const cspParts = Object.entries(directives)
      .filter(([_, values]) => values && Array.isArray(values) && values.length > 0)
      .map(([key, values]) => {
        const directive = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${directive} ${(values as string[]).join(' ')}`;
      });

    // Prevent MIME sniffing for downloads
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', cspParts.join('; '));

    next();
  }

  private getAllowedOrigins(): string[] {
    const allowlistEnv = process.env.CORS_ALLOWLIST || process.env.FRONTEND_URL || 'http://localhost:5173';
    return allowlistEnv
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
}
