import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { RequestWithNonce } from './csp.middleware';

@Injectable()
export class CspService {
  /**
   * Get the nonce for the current request
   */
  getNonce(req: RequestWithNonce): string {
    return req.nonce || '';
  }

  /**
   * Generate CSP directives with nonces
   */
  generateCspDirectives(req: RequestWithNonce, allowedOrigins: string[]) {
    const nonce = this.getNonce(req);

    return {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        nonce ? `'nonce-${nonce}'` : null,
        // Allow Vite HMR in development
        process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : null,
      ].filter(Boolean),
      styleSrc: [
        "'self'",
        'https:',
        nonce ? `'nonce-${nonce}'` : null,
        // Allow Vite HMR in development
        process.env.NODE_ENV === 'development' ? "'unsafe-inline'" : null,
      ].filter(Boolean),
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: [
        "'self'",
        ...allowedOrigins,
        // Allow Vite HMR in development
        process.env.NODE_ENV === 'development' ? 'ws://localhost:*' : null,
        process.env.NODE_ENV === 'development' ? 'wss://localhost:*' : null,
      ].filter(Boolean),
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"],
      baseUri: ["'self'"],
      frameAncestors: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    };
  }

  /**
   * Generate a hash for inline content
   */
  generateHash(content: string, algorithm: 'sha256' | 'sha384' | 'sha512' = 'sha256'): string {
    const hash = createHash(algorithm);
    hash.update(content);
    return `${algorithm}-${hash.digest('base64')}`;
  }
}
