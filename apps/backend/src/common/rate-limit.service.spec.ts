import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RateLimitService } from './rate-limit.service';

const mockRedis = {
  pipeline: jest.fn(),
  quit: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
};

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => mockRedis);
});

describe('RateLimitService', () => {
  let service: RateLimitService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                REDIS_HOST: 'localhost',
                REDIS_PORT: 6379,
                REDIS_PASSWORD: undefined,
                REDIS_RATE_LIMIT_DB: 1,
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RateLimitService>(RateLimitService);
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate correct user key', async () => {
    const key = await service.getUserKey('user123', 'GET:/api/users');
    expect(key).toBe('user:user123:route:GET:/api/users');
  });

  it('should generate correct IP key', async () => {
    const key = await service.getIpKey('192.168.1.1', 'POST:/api/auth/login');
    expect(key).toBe('ip:192.168.1.1:route:POST:/api/auth/login');
  });

  it('should generate correct route key', async () => {
    const key = await service.getRouteKey('GET:/api/students');
    expect(key).toBe('route:GET:/api/students');
  });

  it('should handle rate limit check with Redis error gracefully', async () => {
    const mockPipeline = {
      zremrangebyscore: jest.fn().mockReturnThis(),
      zadd: jest.fn().mockReturnThis(),
      zcard: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockRejectedValue(new Error('Redis connection failed')),
    };
    mockRedis.pipeline.mockReturnValue(mockPipeline);

    const result = await service.checkRateLimit('test-key', {
      limit: 10,
      windowMs: 60000,
    });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(10);
    expect(result.resetTime).toBeGreaterThan(Date.now());
  });

  it('should check rate limit successfully', async () => {
    const mockPipeline = {
      zremrangebyscore: jest.fn().mockReturnThis(),
      zadd: jest.fn().mockReturnThis(),
      zcard: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        [null, 0],
        [null, 1],
        [null, 5],
        [null, 1],
      ]),
    };
    mockRedis.pipeline.mockReturnValue(mockPipeline);

    const result = await service.checkRateLimit('test-key', {
      limit: 10,
      windowMs: 60000,
    });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(5);
    expect(mockPipeline.zremrangebyscore).toHaveBeenCalled();
    expect(mockPipeline.zadd).toHaveBeenCalled();
    expect(mockPipeline.zcard).toHaveBeenCalled();
    expect(mockPipeline.expire).toHaveBeenCalled();
  });
});
