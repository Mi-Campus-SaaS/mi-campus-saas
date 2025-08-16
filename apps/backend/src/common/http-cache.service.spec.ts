import { Test, TestingModule } from '@nestjs/testing';
import { HttpCacheService } from './http-cache.service';
import { Request, Response } from 'express';
import { InMemoryCacheService } from './cache.service';
import { ConfigService } from '@nestjs/config';

describe('HttpCacheService', () => {
  let service: HttpCacheService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HttpCacheService,
        InMemoryCacheService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn((key: string) => (key === 'httpCacheTtlSeconds' ? 300 : undefined)) },
        },
      ],
    }).compile();

    service = module.get<HttpCacheService>(HttpCacheService);

    // Mock Express Request
    mockRequest = {
      get: jest.fn(),
    };

    // Mock Express Response
    mockResponse = {
      set: jest.fn(),
      status: jest.fn().mockReturnThis(),
      end: jest.fn(),
    };
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateETag', () => {
    it('should generate consistent ETags for same data', () => {
      const data = { id: 1, name: 'test' };
      const etag1 = service.generateETag(data);
      const etag2 = service.generateETag(data);

      expect(etag1).toBe(etag2);
      expect(etag1).toMatch(/^"[a-f0-9]{32}"$/); // MD5 hash format
    });

    it('should generate different ETags for different data', () => {
      const data1 = { id: 1, name: 'test1' };
      const data2 = { id: 2, name: 'test2' };

      const etag1 = service.generateETag(data1);
      const etag2 = service.generateETag(data2);

      expect(etag1).not.toBe(etag2);
    });

    it('should handle string data', () => {
      const data = 'test string';
      const etag = service.generateETag(data);

      expect(etag).toMatch(/^"[a-f0-9]{32}"$/);
    });
  });

  describe('generateLastModified', () => {
    it('should return current date for empty data', () => {
      const before = new Date();
      const lastModified = service.generateLastModified([]);
      const after = new Date();

      expect(lastModified.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(lastModified.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should return most recent updatedAt from data', () => {
      const oldDate = new Date('2023-01-01');
      const newDate = new Date('2023-12-31');

      const data = [
        { id: 1, updatedAt: oldDate },
        { id: 2, updatedAt: newDate },
        { id: 3, updatedAt: new Date('2023-06-15') },
      ];

      const lastModified = service.generateLastModified(data);
      expect(lastModified).toEqual(newDate);
    });

    it('should handle different timestamp field names', () => {
      const testDate = new Date('2023-12-31');

      const dataWithCreatedAt = [{ id: 1, createdAt: testDate }];
      const dataWithUpdatedAt = [{ id: 1, updated_at: testDate }];

      expect(service.generateLastModified(dataWithCreatedAt)).toEqual(testDate);
      expect(service.generateLastModified(dataWithUpdatedAt)).toEqual(testDate);
    });
  });

  describe('isNotModified', () => {
    const mockETag = '"abc123"';
    const mockDate = new Date('2023-12-31T12:00:00Z');

    it('should return true when If-None-Match matches ETag', () => {
      (mockRequest.get as jest.Mock)
        .mockReturnValueOnce(mockETag) // If-None-Match
        .mockReturnValueOnce(undefined); // If-Modified-Since

      const result = service.isNotModified(mockRequest as Request, mockETag, mockDate);
      expect(result).toBe(true);
    });

    it('should return true when If-None-Match contains matching ETag in list', () => {
      (mockRequest.get as jest.Mock)
        .mockReturnValueOnce('"other", "abc123", "another"') // If-None-Match
        .mockReturnValueOnce(undefined); // If-Modified-Since

      const result = service.isNotModified(mockRequest as Request, mockETag, mockDate);
      expect(result).toBe(true);
    });

    it('should return true when If-None-Match is "*"', () => {
      (mockRequest.get as jest.Mock)
        .mockReturnValueOnce('*') // If-None-Match
        .mockReturnValueOnce(undefined); // If-Modified-Since

      const result = service.isNotModified(mockRequest as Request, mockETag, mockDate);
      expect(result).toBe(true);
    });

    it('should return true when If-Modified-Since is after lastModified', () => {
      const laterDate = new Date('2024-01-01T12:00:00Z');

      (mockRequest.get as jest.Mock)
        .mockReturnValueOnce(undefined) // If-None-Match
        .mockReturnValueOnce(laterDate.toUTCString()); // If-Modified-Since

      const result = service.isNotModified(mockRequest as Request, mockETag, mockDate);
      expect(result).toBe(true);
    });

    it('should return false when neither condition matches', () => {
      (mockRequest.get as jest.Mock)
        .mockReturnValueOnce('"different"') // If-None-Match
        .mockReturnValueOnce('2023-01-01T12:00:00Z'); // If-Modified-Since

      const result = service.isNotModified(mockRequest as Request, mockETag, mockDate);
      expect(result).toBe(false);
    });

    it('should prioritize ETag over If-Modified-Since', () => {
      (mockRequest.get as jest.Mock)
        .mockReturnValueOnce('"different"') // If-None-Match (doesn't match)
        .mockReturnValueOnce('2024-01-01T12:00:00Z'); // If-Modified-Since (would match)

      const result = service.isNotModified(mockRequest as Request, mockETag, mockDate);
      expect(result).toBe(false);
    });
  });

  describe('setCacheHeaders', () => {
    it('should set all required cache headers', () => {
      const metadata = {
        etag: '"abc123"',
        lastModified: new Date('2023-12-31T12:00:00Z'),
        maxAge: 300,
      };

      service.setCacheHeaders(mockResponse as Response, metadata);

      expect(mockResponse.set).toHaveBeenCalledWith('ETag', '"abc123"');
      expect(mockResponse.set).toHaveBeenCalledWith('Last-Modified', 'Sun, 31 Dec 2023 12:00:00 GMT');
      expect(mockResponse.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=300, must-revalidate');
      expect(mockResponse.set).toHaveBeenCalledWith('Vary', 'If-None-Match, If-Modified-Since');
    });
  });

  describe('handleConditionalRequest', () => {
    const mockData = [{ id: 1, name: 'test', updatedAt: new Date('2023-12-31') }];

    it('should return 304 when cache is valid', () => {
      const etag = service.generateETag(mockData);

      (mockRequest.get as jest.Mock)
        .mockReturnValueOnce(etag) // If-None-Match
        .mockReturnValueOnce(undefined); // If-Modified-Since

      const result = service.handleConditionalRequest(mockRequest as Request, mockResponse as Response, mockData);

      expect(result.shouldReturn304).toBe(true);
      expect(mockResponse.set).toHaveBeenCalledWith('ETag', etag);
    });

    it('should return false when cache is invalid', () => {
      (mockRequest.get as jest.Mock)
        .mockReturnValueOnce('"different"') // If-None-Match
        .mockReturnValueOnce(undefined); // If-Modified-Since

      const result = service.handleConditionalRequest(mockRequest as Request, mockResponse as Response, mockData);

      expect(result.shouldReturn304).toBe(false);
    });

    it('should respect custom cache options', () => {
      const options = { maxAge: 600, generateEtag: false };

      (mockRequest.get as jest.Mock).mockReturnValue(undefined);

      const result = service.handleConditionalRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockData,
        options,
      );

      expect(result.shouldReturn304).toBe(false); // No ETag generated
      expect(mockResponse.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=600, must-revalidate');
    });
  });

  describe('sendNotModified', () => {
    it('should send 304 status and end response', () => {
      service.sendNotModified(mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(304);
      expect(mockResponse.end).toHaveBeenCalled();
    });
  });

  describe('createCacheKey', () => {
    it('should create consistent cache keys', () => {
      const key1 = service.createCacheKey('students', { page: 1, limit: 10 });
      const key2 = service.createCacheKey('students', { page: 1, limit: 10 });

      expect(key1).toBe(key2);
      expect(key1).toMatch(/^http-cache:students:[a-f0-9]{32}$/);
    });

    it('should create different keys for different parameters', () => {
      const key1 = service.createCacheKey('students', { page: 1 });
      const key2 = service.createCacheKey('students', { page: 2 });

      expect(key1).not.toBe(key2);
    });

    it('should sort parameters consistently', () => {
      const key1 = service.createCacheKey('students', { page: 1, limit: 10 });
      const key2 = service.createCacheKey('students', { limit: 10, page: 1 });

      expect(key1).toBe(key2);
    });
  });
});
