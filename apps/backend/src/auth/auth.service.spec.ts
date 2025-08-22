import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/roles.enum';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AccountLockoutService } from './account-lockout.service';
import { AuditLogger } from '../common/audit.logger';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { TwoFactorAuth } from './entities/two-factor-auth.entity';

describe('AuthService', () => {
  let service: AuthService;
  let users: Partial<UsersService>;
  let jwt: Partial<JwtService>;
  let config: Partial<ConfigService>;
  let refreshRepo: Partial<Repository<RefreshToken>>;
  let twoFactorAuthRepo: Partial<Repository<TwoFactorAuth>>;
  let twoFactorAuthService: Partial<TwoFactorAuthService>;
  let lockoutService: Partial<AccountLockoutService>;
  let auditLogger: Partial<AuditLogger>;

  beforeEach(async () => {
    users = {
      findByUsername: jest.fn(),
    };

    jwt = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    config = {
      get: jest.fn(),
    };

    lockoutService = {
      checkAccountLocked: jest.fn(),
      getRemainingLockoutTime: jest.fn(),
      recordSuccessfulLogin: jest.fn(),
      recordFailedLogin: jest.fn(),
      getFailedAttemptsRemaining: jest.fn(),
    };

    auditLogger = {
      log: jest.fn().mockReturnValue(Promise.resolve()),
    };

    refreshRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
    };

    twoFactorAuthRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    twoFactorAuthService = {
      generateSecret: jest.fn(),
      enrollUser: jest.fn(),
      enable2fa: jest.fn(),
      disable2fa: jest.fn(),
      verify2fa: jest.fn(),
      generateNewBackupCodes: jest.fn(),
      get2faStatus: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users as unknown as UsersService },
        { provide: JwtService, useValue: jwt as unknown as JwtService },
        { provide: ConfigService, useValue: config as unknown as ConfigService },
        { provide: getRepositoryToken(RefreshToken), useValue: refreshRepo as unknown as Repository<RefreshToken> },
        {
          provide: getRepositoryToken(TwoFactorAuth),
          useValue: twoFactorAuthRepo as unknown as Repository<TwoFactorAuth>,
        },
        { provide: AccountLockoutService, useValue: lockoutService as unknown as AccountLockoutService },
        { provide: TwoFactorAuthService, useValue: twoFactorAuthService },
        { provide: AuditLogger, useValue: auditLogger as unknown as AuditLogger },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('validateUser', () => {
    it('returns null when user not found', async () => {
      (users.findByUsername as jest.Mock).mockResolvedValue(null);
      const res = await service.validateUser('user', 'pass');
      expect(res).toBeNull();
    });

    it('returns user when password matches', async () => {
      const passwordHash = await bcrypt.hash('secret', 1);
      const user = { id: '1', username: 'u', passwordHash } as User;
      (users.findByUsername as jest.Mock).mockResolvedValue(user);
      (lockoutService.checkAccountLocked as jest.Mock).mockResolvedValue(false);
      (lockoutService.recordSuccessfulLogin as jest.Mock).mockResolvedValue(undefined);

      const res = await service.validateUser('u', 'secret');
      expect(res?.username).toBe('u');
    });

    it('returns null when password mismatch', async () => {
      const passwordHash = await bcrypt.hash('secret', 1);
      const user = { id: '1', username: 'u', passwordHash } as User;
      (users.findByUsername as jest.Mock).mockResolvedValue(user);
      (lockoutService.checkAccountLocked as jest.Mock).mockResolvedValue(false);
      (lockoutService.recordFailedLogin as jest.Mock).mockResolvedValue(undefined);
      (lockoutService.getFailedAttemptsRemaining as jest.Mock).mockReturnValue(2);

      await expect(service.validateUser('u', 'nope')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('throws when user missing', async () => {
      await expect(service.login(null as unknown as User)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns tokens and user payload', async () => {
      (jwt.signAsync as jest.Mock).mockResolvedValue('access');
      const dummyToken: RefreshToken = {
        id: 'rid',
        tokenHash: '',
        expiresAt: new Date(Date.now() + 60000),
        createdAt: new Date(),
        createdByIp: null,
        revokedAt: null,
        revokedByIp: null,
        revokedReason: null,
        replacedByTokenId: null,
        user: {} as User,
      } as RefreshToken;
      (refreshRepo.save as jest.Mock).mockResolvedValueOnce(dummyToken);
      (twoFactorAuthService.get2faStatus as jest.Mock).mockResolvedValue({ isEnabled: false });
      const user: User = {
        id: 'u1',
        username: 'u',
        displayName: 'U',
        passwordHash: 'ignored',
        role: UserRole.ADMIN,
        student: null,
        teacher: null,
        failedLoginAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      const res = await service.login(user, '127.0.0.1');
      expect(res.access_token).toBe('access');
      expect(res.refresh_token).toBeDefined();
      expect(res.user.username).toBe('u');
    });
  });

  describe('refresh', () => {
    it('throws on invalid token format', async () => {
      await expect(service.refresh('badtoken')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rotates refresh token and returns new tokens', async () => {
      (jwt.signAsync as jest.Mock).mockResolvedValue('new_access');
      const rawToken = 'rawtoken';
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const token: RefreshToken = {
        id: 'id1',
        tokenHash: tokenHash,
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: new Date(),
        createdByIp: null,
        revokedAt: null,
        revokedByIp: null,
        revokedReason: null,
        replacedByTokenId: null,
        user: {
          id: 'u',
          username: 'u',
          displayName: 'U',
          passwordHash: 'x',
          role: UserRole.ADMIN,
          student: null,
          teacher: null,
          failedLoginAttempts: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        } as User,
      } as RefreshToken;
      (refreshRepo.findOne as jest.Mock).mockResolvedValue(token);
      (refreshRepo.save as jest.Mock).mockResolvedValueOnce(token);
      (refreshRepo.save as jest.Mock).mockResolvedValueOnce(token);

      const res = await service.refresh(`id1.${rawToken}`);
      expect(res.access_token).toBe('new_access');
      expect(res.refresh_token).toBeDefined();
    });
  });

  describe('revoke', () => {
    it('throws on invalid token format', async () => {
      await expect(service.revoke('badtoken')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('silently returns when token not found', async () => {
      (refreshRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.revoke('valid.id')).resolves.toBeUndefined();
    });
  });
});
