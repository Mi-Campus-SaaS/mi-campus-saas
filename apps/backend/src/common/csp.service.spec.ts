import { Test, TestingModule } from '@nestjs/testing';
import { CspService } from './csp.service';
import { RequestWithNonce } from './csp.middleware';

describe('CspService', () => {
  let service: CspService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CspService],
    }).compile();

    service = module.get<CspService>(CspService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNonce', () => {
    it('should return nonce from request', () => {
      const mockReq = { nonce: 'test-nonce-123' } as RequestWithNonce;
      expect(service.getNonce(mockReq)).toBe('test-nonce-123');
    });

    it('should return empty string if no nonce', () => {
      const mockReq = {} as RequestWithNonce;
      expect(service.getNonce(mockReq)).toBe('');
    });
  });

  describe('generateCspDirectives', () => {
    it('should generate CSP directives with nonce', () => {
      const mockReq = { nonce: 'test-nonce-123' } as RequestWithNonce;
      const allowedOrigins = ['http://localhost:5173'];

      const directives = service.generateCspDirectives(mockReq, allowedOrigins);

      expect(directives.scriptSrc).toContain("'nonce-test-nonce-123'");
      expect(directives.styleSrc).toContain("'nonce-test-nonce-123'");
      expect(directives.connectSrc).toContain('http://localhost:5173');
    });

    it('should include development-specific directives in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const mockReq = { nonce: 'test-nonce-123' } as RequestWithNonce;
      const allowedOrigins = ['http://localhost:5173'];

      const directives = service.generateCspDirectives(mockReq, allowedOrigins);

      expect(directives.scriptSrc).toContain("'unsafe-eval'");
      expect(directives.styleSrc).toContain("'unsafe-inline'");
      expect(directives.connectSrc).toContain('ws://localhost:*');

      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should not include development-specific directives in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mockReq = { nonce: 'test-nonce-123' } as RequestWithNonce;
      const allowedOrigins = ['http://localhost:5173'];

      const directives = service.generateCspDirectives(mockReq, allowedOrigins);

      expect(directives.scriptSrc).not.toContain("'unsafe-eval'");
      expect(directives.styleSrc).not.toContain("'unsafe-inline'");
      expect(directives.connectSrc).not.toContain('ws://localhost:*');

      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('generateHash', () => {
    it('should generate SHA-256 hash', () => {
      const content = 'test content';
      const hash = service.generateHash(content, 'sha256');

      expect(hash).toMatch(/^sha256-/);
      expect(hash.length).toBeGreaterThan(10);
    });

    it('should generate different hashes for different content', () => {
      const hash1 = service.generateHash('content1');
      const hash2 = service.generateHash('content2');

      expect(hash1).not.toBe(hash2);
    });
  });
});
