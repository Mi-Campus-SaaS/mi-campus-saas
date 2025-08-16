import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { createHash } from 'crypto';

export interface CacheMetadata {
  etag: string;
  lastModified: Date;
  maxAge?: number; // seconds
}

export interface CacheOptions {
  maxAge?: number; // seconds, default 300 (5 minutes)
  generateEtag?: boolean; // default true
  useLastModified?: boolean; // default true
}

@Injectable()
export class HttpCacheService {
  private readonly defaultMaxAge = 300; // 5 minutes

  /**
   * Generate ETag from data content
   */
  generateETag(data: any): string {
    const content = typeof data === 'string' ? data : JSON.stringify(data);
    return `"${createHash('md5').update(content).digest('hex')}"`;
  }

  /**
   * Generate Last-Modified date from data or current time
   */
  generateLastModified(data?: any[]): Date {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return new Date();
    }

    // Find the most recent updatedAt date from the data
    const dates = data
      .map((item) => {
        // Handle different possible timestamp field names
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const timestamp = item.updatedAt || item.updated_at || item.modifiedAt || item.created_at || item.createdAt;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return timestamp ? new Date(timestamp) : null;
      })
      .filter((date): date is Date => date !== null)
      .sort((a, b) => b.getTime() - a.getTime());

    return dates.length > 0 ? dates[0] : new Date();
  }

  /**
   * Check if the request should return 304 Not Modified
   */
  isNotModified(req: Request, etag: string, lastModified: Date): boolean {
    const ifNoneMatch = req.get('If-None-Match');
    const ifModifiedSince = req.get('If-Modified-Since');

    // ETag check (stronger validator)
    if (ifNoneMatch) {
      // Handle multiple ETags in If-None-Match
      const clientETags = ifNoneMatch.split(',').map((tag) => tag.trim());
      if (clientETags.includes(etag) || clientETags.includes('*')) {
        return true;
      }
    }

    // Last-Modified check (weaker validator)
    if (!ifNoneMatch && ifModifiedSince) {
      const clientModifiedSince = new Date(ifModifiedSince);
      // Use <= comparison to handle same-second modifications
      if (!isNaN(clientModifiedSince.getTime()) && lastModified <= clientModifiedSince) {
        return true;
      }
    }

    return false;
  }

  /**
   * Set cache headers on response
   */
  setCacheHeaders(res: Response, metadata: CacheMetadata): void {
    // Set ETag
    res.set('ETag', metadata.etag);

    // Set Last-Modified
    res.set('Last-Modified', metadata.lastModified.toUTCString());

    // Set Cache-Control
    const maxAge = metadata.maxAge || this.defaultMaxAge;
    res.set('Cache-Control', `public, max-age=${maxAge}, must-revalidate`);

    // Set Vary header to indicate that the response varies based on these headers
    res.set('Vary', 'If-None-Match, If-Modified-Since');
  }

  /**
   * Handle conditional request and set cache headers
   * Returns true if 304 should be sent, false if normal response should be sent
   */
  handleConditionalRequest(
    req: Request,
    res: Response,
    data: any,
    options: CacheOptions = {},
  ): { shouldReturn304: boolean; metadata: CacheMetadata } {
    const { maxAge = this.defaultMaxAge, generateEtag = true, useLastModified = true } = options;

    // Generate cache metadata
    const etag = generateEtag ? this.generateETag(data) : '';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const lastModified = useLastModified ? this.generateLastModified(data) : new Date();

    const metadata: CacheMetadata = {
      etag,
      lastModified,
      maxAge,
    };

    // Set cache headers
    this.setCacheHeaders(res, metadata);

    // Check if client cache is still valid
    const shouldReturn304 = generateEtag && this.isNotModified(req, etag, lastModified);

    return { shouldReturn304, metadata };
  }

  /**
   * Send 304 Not Modified response
   */
  sendNotModified(res: Response): void {
    res.status(304).end();
  }

  /**
   * Helper to create cache key for storing computed ETags/Last-Modified
   */
  createCacheKey(endpoint: string, params: Record<string, any> = {}): string {
    const paramString = Object.keys(params)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => `${key}:${params[key]}`)
      .join('|');
    return `http-cache:${endpoint}:${createHash('md5').update(paramString).digest('hex')}`;
  }
}
