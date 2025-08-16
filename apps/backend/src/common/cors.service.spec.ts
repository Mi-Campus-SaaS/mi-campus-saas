import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CorsService } from './cors.service';

describe('CorsService', () => {
  let service: CorsService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CorsService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CorsService>(CorsService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCorsOptions', () => {
    it('should allow server-to-server requests when enabled', (done) => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'cors.allowServerToServer') return true;
        if (key === 'cors.allowlist') return 'https://example.com';
        return undefined;
      });

      const corsOptions = service.createCorsOptions();

      // Mock request without Origin header (server-to-server)
      const mockReq = { header: jest.fn().mockReturnValue(undefined) };

      if (typeof corsOptions === 'function') {
        corsOptions(mockReq as any, (err, options) => {
          expect(err).toBeNull();
          expect(options).toEqual({
            origin: false,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
          });
          done();
        });
      }
    });

    it('should reject server-to-server requests when disabled', (done) => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'cors.allowServerToServer') return false;
        if (key === 'cors.allowlist') return 'https://example.com';
        return undefined;
      });

      const corsOptions = service.createCorsOptions();

      // Mock request without Origin header (server-to-server)
      const mockReq = { header: jest.fn().mockReturnValue(undefined) };

      if (typeof corsOptions === 'function') {
        corsOptions(mockReq as any, (err, options) => {
          expect(err).toBeInstanceOf(Error);
          expect(err?.message).toBe('Server-to-server requests not allowed');
          expect(options).toBe(false);
          done();
        });
      }
    });

    it('should allow exact origin matches', (done) => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'cors.allowServerToServer') return false;
        if (key === 'cors.allowlist') return 'https://example.com,http://localhost:3000';
        return undefined;
      });

      const corsOptions = service.createCorsOptions();

      const mockReq = { header: jest.fn().mockReturnValue('https://example.com') };

      if (typeof corsOptions === 'function') {
        corsOptions(mockReq as any, (err, options) => {
          expect(err).toBeNull();
          expect(options).toEqual({
            origin: true,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
          });
          done();
        });
      }
    });

    it('should allow wildcard subdomain matches', (done) => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'cors.allowServerToServer') return false;
        if (key === 'cors.allowlist') return 'https://*.example.com';
        return undefined;
      });

      const corsOptions = service.createCorsOptions();

      const mockReq = { header: jest.fn().mockReturnValue('https://app.example.com') };

      if (typeof corsOptions === 'function') {
        corsOptions(mockReq as any, (err, options) => {
          expect(err).toBeNull();
          expect(options).toEqual({
            origin: true,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
          });
          done();
        });
      }
    });

    it('should allow wildcard port matches', (done) => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'cors.allowServerToServer') return false;
        if (key === 'cors.allowlist') return 'http://localhost:*';
        return undefined;
      });

      const corsOptions = service.createCorsOptions();

      const mockReq = { header: jest.fn().mockReturnValue('http://localhost:5173') };

      if (typeof corsOptions === 'function') {
        corsOptions(mockReq as any, (err, options) => {
          expect(err).toBeNull();
          expect(options).toEqual({
            origin: true,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
          });
          done();
        });
      }
    });

    it('should reject non-matching origins', (done) => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'cors.allowServerToServer') return false;
        if (key === 'cors.allowlist') return 'https://example.com';
        return undefined;
      });

      const corsOptions = service.createCorsOptions();

      const mockReq = { header: jest.fn().mockReturnValue('https://malicious.com') };

      if (typeof corsOptions === 'function') {
        corsOptions(mockReq as any, (err, options) => {
          expect(err).toBeInstanceOf(Error);
          expect(err?.message).toBe('Origin https://malicious.com not allowed by CORS policy');
          expect(options).toBe(false);
          done();
        });
      }
    });
  });

  describe('createDevelopmentCorsOptions', () => {
    it('should return permissive options for development', () => {
      const options = service.createDevelopmentCorsOptions();

      expect(options).toEqual({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      });
    });
  });

  describe('wildcard pattern matching', () => {
    it('should match Vercel preview deployments', (done) => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'cors.allowServerToServer') return false;
        if (key === 'cors.allowlist') return 'https://myapp-*.vercel.app';
        return undefined;
      });

      const corsOptions = service.createCorsOptions();

      const mockReq = { header: jest.fn().mockReturnValue('https://myapp-git-feature-branch.vercel.app') };

      if (typeof corsOptions === 'function') {
        corsOptions(mockReq as any, (err, options) => {
          expect(err).toBeNull();
          expect(options?.origin).toBe(true);
          done();
        });
      }
    });

    it('should not match unrelated domains with wildcards', (done) => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'cors.allowServerToServer') return false;
        if (key === 'cors.allowlist') return 'https://*.example.com';
        return undefined;
      });

      const corsOptions = service.createCorsOptions();

      const mockReq = { header: jest.fn().mockReturnValue('https://malicious.other.com') };

      if (typeof corsOptions === 'function') {
        corsOptions(mockReq as any, (err, options) => {
          expect(err).toBeInstanceOf(Error);
          expect(options).toBe(false);
          done();
        });
      }
    });
  });
});
