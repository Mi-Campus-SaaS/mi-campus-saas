import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CorsOptions, CorsOptionsDelegate } from '@nestjs/common/interfaces/external/cors-options.interface';

@Injectable()
export class CorsService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Creates CORS configuration with support for:
   * - Wildcard patterns in allowlist
   * - Server-to-server requests (no Origin header)
   * - Environment-based allowlist configuration
   */
  createCorsOptions(): CorsOptionsDelegate<any> {
    const allowlist = this.configService.get<string>('cors.allowlist', '');
    const allowServerToServer = this.configService.get<boolean>('cors.allowServerToServer', false);

    return ((req: any, cb: any): void => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const origin = req.header('Origin') as string | undefined;

      // Server-to-server: No Origin header
      if (!origin) {
        if (allowServerToServer) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
          return cb(null, {
            origin: false,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: [
              'Content-Type',
              'Authorization',
              'X-Requested-With',
              'Idempotency-Key',
              'idempotency-key',
              'X-Idempotency-Key',
            ],
          });
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
          return cb(new Error('Server-to-server requests not allowed'), false);
        }
      }

      // Check if origin matches allowlist (with wildcard support)
      const isAllowed = this.isOriginAllowed(origin, allowlist || '');

      if (isAllowed) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        cb(null, {
          origin: true,
          credentials: true,
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
          allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'Idempotency-Key',
            'idempotency-key',
            'X-Idempotency-Key',
          ],
        });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        cb(new Error(`Origin ${origin} not allowed by CORS policy`), false);
      }
    }) as CorsOptionsDelegate<any>;
  }

  /**
   * Check if origin is allowed based on allowlist with wildcard support
   * Supports patterns like:
   * - https://*.example.com
   * - https://app-*.vercel.app
   * - http://localhost:*
   */
  private isOriginAllowed(origin: string, allowlist: string): boolean {
    if (!allowlist) {
      return false;
    }

    const allowedOrigins = allowlist.split(',').map((o) => o.trim());

    return allowedOrigins.some((allowedOrigin) => {
      // Exact match
      if (allowedOrigin === origin) {
        return true;
      }

      // Wildcard pattern matching
      if (allowedOrigin.includes('*')) {
        const pattern = this.createRegexFromWildcard(allowedOrigin);
        return pattern.test(origin);
      }

      return false;
    });
  }

  /**
   * Convert wildcard pattern to regex
   * Examples:
   * - https://*.example.com → /^https:\/\/[^/:]+\.example\.com$/
   * - http://localhost:* → /^http:\/\/localhost:[0-9]+$/
   */
  private createRegexFromWildcard(pattern: string): RegExp {
    // Replace * with a placeholder first to avoid conflicts with regex escaping
    let regexPattern = pattern.replace(/\*/g, '__WILDCARD__');

    // Escape special regex characters
    regexPattern = regexPattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

    // Handle port wildcards specifically (e.g., localhost:__WILDCARD__)
    regexPattern = regexPattern.replace(/:__WILDCARD__(?=$|\/)/g, ':[0-9]+');

    // Handle general wildcards (e.g., *.example.com, app-*.vercel.app)
    regexPattern = regexPattern.replace(/__WILDCARD__/g, '[^/:]+');

    return new RegExp(`^${regexPattern}$`);
  }

  /**
   * Get development CORS options (more permissive for local development)
   */
  createDevelopmentCorsOptions(): CorsOptions {
    return {
      origin: true, // Allow all origins in development
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Idempotency-Key',
        'idempotency-key',
        'X-Idempotency-Key',
      ],
    };
  }
}
