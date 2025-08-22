import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { Request } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { AccountLockoutService } from './account-lockout.service';
import { PasswordPolicyService } from './password-policy.service';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/roles.enum';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { PassportModule } from '@nestjs/passport';
import { AuthGuard } from '@nestjs/passport';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let authService: AuthService;
  let twoFactorAuthService: TwoFactorAuthService;

  const mockUser: User = {
    id: 'user-123',
    username: 'admin',
    displayName: 'Admin User',
    passwordHash: 'hash',
    role: UserRole.ADMIN,
    failedLoginAttempts: 0,
  } as User;

  const mockJwtAuthGuard = {
    canActivate: jest.fn().mockImplementation((context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest();
      request.user = mockUser;
      return true;
    }),
  };

  const mockRolesGuard = {
    canActivate: jest.fn().mockImplementation((context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest();
      if (!request.user) {
        request.user = mockUser;
      }
      return true;
    }),
  };

  beforeEach(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            verify2faAndLogin: jest.fn(),
            refresh: jest.fn(),
            revoke: jest.fn(),
          },
        },
        {
          provide: TwoFactorAuthService,
          useValue: {
            enrollUser: jest.fn(),
            enable2fa: jest.fn(),
            disable2fa: jest.fn(),
            generateNewBackupCodes: jest.fn(),
            get2faStatus: jest.fn(),
          },
        },
        {
          provide: AccountLockoutService,
          useValue: {
            unlockAccountById: jest.fn(),
          },
        },
        {
          provide: PasswordPolicyService,
          useValue: {
            getPasswordRequirements: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .overrideGuard(AuthGuard('local'))
      .useValue({
        canActivate: jest.fn().mockImplementation((context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          request.user = mockUser;
          return true;
        }),
      })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({
        canActivate: jest.fn().mockImplementation((context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          request.user = mockUser;
          return true;
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    authService = moduleFixture.get<AuthService>(AuthService);
    twoFactorAuthService = moduleFixture.get<TwoFactorAuthService>(TwoFactorAuthService);

    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('should return login response without 2FA for non-admin users', async () => {
      const loginResponse = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        user: {
          id: mockUser.id,
          username: mockUser.username,
          role: mockUser.role,
          displayName: mockUser.displayName,
        },
      };

      jest.spyOn(authService, 'login').mockResolvedValue(loginResponse);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'user', password: 'password' })
        .expect(201)
        .expect(loginResponse);

      expect(authService.login).toHaveBeenCalled();
    });

    it('should return 2FA required response for admin users', async () => {
      const twoFactorResponse = {
        requires2fa: true,
        user: {
          id: mockUser.id,
          username: mockUser.username,
          role: mockUser.role,
          displayName: mockUser.displayName,
        },
      };

      jest.spyOn(authService, 'login').mockResolvedValue(twoFactorResponse);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'admin', password: 'password' })
        .expect(201)
        .expect(twoFactorResponse);

      expect(authService.login).toHaveBeenCalled();
    });
  });

  describe('POST /auth/verify-2fa', () => {
    it('should verify 2FA and complete login', async () => {
      const loginResponse = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        user: {
          id: mockUser.id,
          username: mockUser.username,
          role: mockUser.role,
          displayName: mockUser.displayName,
        },
      };

      jest.spyOn(authService, 'verify2faAndLogin').mockResolvedValue(loginResponse);

      const controller = moduleFixture.get<AuthController>(AuthController);
      const mockRequest = { user: mockUser } as Request & { user: User };
      const mockIp = '127.0.0.1';

      const result = await controller.verify2fa({ code: '123456' }, mockRequest, mockIp);

      expect(result).toEqual(loginResponse);
      expect(authService.verify2faAndLogin).toHaveBeenCalledWith(mockUser, '123456', mockIp);
    });
  });

  describe('POST /auth/2fa/enroll', () => {
    it('should enroll user in 2FA', async () => {
      const enrollResponse = {
        secret: 'JBSWY3DPEHPK3PXP',
        qrCode: 'data:image/png;base64,mock-qr-code',
        backupCodes: ['ABC12345', 'DEF67890'],
      };

      jest.spyOn(twoFactorAuthService, 'enrollUser').mockResolvedValue(enrollResponse);

      const controller = moduleFixture.get<AuthController>(AuthController);
      const mockRequest = { user: mockUser } as Request & { user: User };

      const result = await controller.enroll2fa(mockRequest);

      expect(result).toEqual(enrollResponse);
      expect(twoFactorAuthService.enrollUser).toHaveBeenCalledWith(mockUser);
    });

    it('should require admin role', async () => {
      mockRolesGuard.canActivate.mockReturnValue(false);

      await request(app.getHttpServer()).post('/auth/2fa/enroll').set('Authorization', 'Bearer mock-token').expect(403);
    });
  });

  describe('POST /auth/2fa/enable', () => {
    it('should enable 2FA', async () => {
      jest.spyOn(twoFactorAuthService, 'enable2fa').mockResolvedValue(undefined);

      const controller = moduleFixture.get<AuthController>(AuthController);
      const mockRequest = { user: mockUser } as Request & { user: User };

      const result = await controller.enable2fa({ totpCode: '123456' }, mockRequest);

      expect(result).toEqual({ message: '2FA enabled successfully' });
      expect(twoFactorAuthService.enable2fa).toHaveBeenCalledWith(mockUser, '123456');
    });
  });

  describe('POST /auth/2fa/disable', () => {
    it('should disable 2FA', async () => {
      jest.spyOn(twoFactorAuthService, 'disable2fa').mockResolvedValue(undefined);

      const controller = moduleFixture.get<AuthController>(AuthController);
      const mockRequest = { user: mockUser } as Request & { user: User };

      const result = await controller.disable2fa({ totpCode: '123456' }, mockRequest);

      expect(result).toEqual({ message: '2FA disabled successfully' });
      expect(twoFactorAuthService.disable2fa).toHaveBeenCalledWith(mockUser, '123456');
    });
  });

  describe('POST /auth/2fa/backup-codes', () => {
    it('should generate new backup codes', async () => {
      const backupCodes = ['ABC12345', 'DEF67890', 'GHI11111'];

      jest.spyOn(twoFactorAuthService, 'generateNewBackupCodes').mockResolvedValue(backupCodes);

      const controller = moduleFixture.get<AuthController>(AuthController);
      const mockRequest = { user: mockUser } as Request & { user: User };

      const result = await controller.generateBackupCodes({ totpCode: '123456' }, mockRequest);

      expect(result).toEqual({ backupCodes });
      expect(twoFactorAuthService.generateNewBackupCodes).toHaveBeenCalledWith(mockUser, '123456');
    });
  });

  describe('GET /auth/2fa/status', () => {
    it('should return 2FA status', async () => {
      const status = { isEnrolled: true, isEnabled: true };

      jest.spyOn(twoFactorAuthService, 'get2faStatus').mockResolvedValue(status);

      const controller = moduleFixture.get<AuthController>(AuthController);
      const mockRequest = { user: mockUser } as Request & { user: User };

      const result = await controller.get2faStatus(mockRequest);

      expect(result).toEqual(status);
      expect(twoFactorAuthService.get2faStatus).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh token', async () => {
      const refreshResponse = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      };

      jest.spyOn(authService, 'refresh').mockResolvedValue(refreshResponse);

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: 'old-refresh-token' })
        .expect(200)
        .expect(refreshResponse);

      expect(authService.refresh).toHaveBeenCalledWith('old-refresh-token', expect.any(String));
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout user', async () => {
      jest.spyOn(authService, 'revoke').mockResolvedValue(undefined);

      await request(app.getHttpServer()).post('/auth/logout').send({ refresh_token: 'refresh-token' }).expect(204);

      expect(authService.revoke).toHaveBeenCalledWith('refresh-token', expect.any(String));
    });
  });

  describe('GET /auth/password-requirements', () => {
    it('should return password requirements', async () => {
      const requirements = [
        'At least 8 characters long',
        'At least one uppercase letter (A-Z)',
        'At least one lowercase letter (a-z)',
        'At least one number (0-9)',
        'At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)',
      ];

      const passwordPolicyService = moduleFixture.get<PasswordPolicyService>(PasswordPolicyService);
      jest.spyOn(passwordPolicyService, 'getPasswordRequirements').mockReturnValue(requirements);

      await request(app.getHttpServer()).get('/auth/password-requirements').expect(200).expect({ requirements });
    });
  });
});
