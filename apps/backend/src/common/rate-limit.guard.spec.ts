import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitGuard } from './rate-limit.guard';
import { RateLimitService } from './rate-limit.service';
import { RateLimitStrategy } from './rate-limit.decorator';

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;
  let reflector: Reflector;
  let rateLimitService: RateLimitService;

  const mockExecutionContext = {
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'GET',
        path: '/api/test',
        route: { path: '/api/test' },
        user: { id: 'user123' },
        ip: '192.168.1.1',
        headers: {},
        connection: { remoteAddress: '192.168.1.1' },
      }),
      getResponse: () => ({
        setHeader: jest.fn(),
      }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: RateLimitService,
          useValue: {
            checkRateLimit: jest.fn(),
            getUserKey: jest.fn(),
            getIpKey: jest.fn(),
            getRouteKey: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RateLimitGuard>(RateLimitGuard);
    reflector = module.get<Reflector>(Reflector);
    rateLimitService = module.get<RateLimitService>(RateLimitService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow request when no rate limit is configured', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const result = await guard.canActivate(mockExecutionContext);
    expect(result).toBe(true);
  });

  it('should handle user-based rate limiting', async () => {
    const options = {
      limit: 10,
      windowMs: 60000,
      strategy: RateLimitStrategy.USER,
    };

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);
    jest.spyOn(rateLimitService, 'getUserKey').mockResolvedValue('user:user123:route:GET:/api/test');
    jest.spyOn(rateLimitService, 'checkRateLimit').mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetTime: Date.now() + 60000,
    });

    const result = await guard.canActivate(mockExecutionContext);
    expect(result).toBe(true);
    expect(rateLimitService.getUserKey).toHaveBeenCalledWith('user123', 'GET:/api/test');
  });

  it('should handle IP-based rate limiting', async () => {
    const options = {
      limit: 20,
      windowMs: 60000,
      strategy: RateLimitStrategy.IP,
    };

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);
    jest.spyOn(rateLimitService, 'getIpKey').mockResolvedValue('ip:192.168.1.1:route:GET:/api/test');
    jest.spyOn(rateLimitService, 'checkRateLimit').mockResolvedValue({
      allowed: true,
      remaining: 19,
      resetTime: Date.now() + 60000,
    });

    const result = await guard.canActivate(mockExecutionContext);
    expect(result).toBe(true);
    expect(rateLimitService.getIpKey).toHaveBeenCalledWith('192.168.1.1', 'GET:/api/test');
  });

  it('should throw exception when rate limit is exceeded', async () => {
    const options = {
      limit: 5,
      windowMs: 60000,
      strategy: RateLimitStrategy.USER,
    };

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);
    jest.spyOn(rateLimitService, 'getUserKey').mockResolvedValue('user:user123:route:GET:/api/test');
    jest.spyOn(rateLimitService, 'checkRateLimit').mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + 60000,
      retryAfter: 30,
    });

    await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(HttpException);
  });

  it('should throw unauthorized when user-based rate limiting is used without authentication', async () => {
    const options = {
      limit: 10,
      windowMs: 60000,
      strategy: RateLimitStrategy.USER,
    };

    const contextWithoutUser = {
      ...mockExecutionContext,
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'GET',
          path: '/api/test',
          route: { path: '/api/test' },
          user: undefined,
          ip: '192.168.1.1',
          headers: {},
          connection: { remoteAddress: '192.168.1.1' },
        }),
        getResponse: () => ({
          setHeader: jest.fn(),
        }),
      }),
    } as ExecutionContext;

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);

    await expect(guard.canActivate(contextWithoutUser)).rejects.toThrow(
      new HttpException('Authentication required for user-based rate limiting', HttpStatus.UNAUTHORIZED),
    );
  });
});
