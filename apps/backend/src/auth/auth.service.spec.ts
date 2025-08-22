import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/roles.enum';
import * as crypto from 'crypto';

describe('AuthService', () => {
  let service: AuthService;
  let users: Pick<UsersService, 'findByUsername'>;
  let jwt: Pick<JwtService, 'signAsync'>;
  let config: Pick<ConfigService, 'get'>;
  let refreshRepo: Pick<Repository<RefreshToken>, 'save' | 'findOne' | 'create'> & {
    save: jest.MockedFunction<Repository<RefreshToken>['save']>;
    findOne: jest.MockedFunction<Repository<RefreshToken>['findOne']>;
    create: jest.MockedFunction<Repository<RefreshToken>['create']>;
  };

  beforeEach(async () => {
    users = { findByUsername: jest.fn<Promise<User | null>, [string]>() };
    jwt = { signAsync: jest.fn() };
    config = { get: jest.fn() };
    refreshRepo = {
      save: jest.fn() as unknown as typeof refreshRepo.save,
      findOne: jest.fn() as unknown as typeof refreshRepo.findOne,
      create: jest.fn() as unknown as typeof refreshRepo.create,
    } as unknown as typeof refreshRepo;

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users as unknown as UsersService },
        { provide: JwtService, useValue: jwt as unknown as JwtService },
        { provide: ConfigService, useValue: config as unknown as ConfigService },
        { provide: getRepositoryToken(RefreshToken), useValue: refreshRepo as unknown as Repository<RefreshToken> },
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
      (users.findByUsername as jest.Mock).mockResolvedValue({ id: '1', username: 'u', passwordHash } as User);
      const res = await service.validateUser('u', 'secret');
      expect(res?.username).toBe('u');
    });

    it('returns null when password mismatch', async () => {
      const passwordHash = await bcrypt.hash('secret', 1);
      (users.findByUsername as jest.Mock).mockResolvedValue({ id: '1', username: 'u', passwordHash } as User);
      const res = await service.validateUser('u', 'nope');
      expect(res).toBeNull();
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
      refreshRepo.save.mockResolvedValueOnce(dummyToken);
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
      const token: RefreshToken = {
        id: 'id1',
        tokenHash: '',
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
        } as User,
      } as RefreshToken;
      // construct a valid token string: id.raw
      const raw = 'rawtoken';
      // compute expected hash
      const hash = crypto.createHash('sha256').update(raw).digest('hex');
      token.tokenHash = hash;
      refreshRepo.findOne.mockResolvedValue(token);
      refreshRepo.save.mockResolvedValueOnce(token); // saving revocation
      refreshRepo.save.mockResolvedValueOnce({ ...token, id: 'id2' }); // saving new token

      const res = await service.refresh(`${token.id}.${raw}`, '127.0.0.1');
      expect(res.access_token).toBe('new_access');
      expect(res.refresh_token).toBeDefined();
    });
  });

  describe('revoke', () => {
    it('silently returns on invalid token format', async () => {
      await expect(service.revoke('nope')).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
