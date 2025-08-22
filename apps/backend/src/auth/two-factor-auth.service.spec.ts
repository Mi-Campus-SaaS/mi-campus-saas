import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { TwoFactorAuth } from './entities/two-factor-auth.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/roles.enum';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

jest.mock('speakeasy');
jest.mock('qrcode');

describe('TwoFactorAuthService', () => {
  let service: TwoFactorAuthService;
  let twoFactorAuthRepo: Repository<TwoFactorAuth>;
  let mockUser: User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwoFactorAuthService,
        {
          provide: getRepositoryToken(TwoFactorAuth),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TwoFactorAuthService>(TwoFactorAuthService);
    twoFactorAuthRepo = module.get<Repository<TwoFactorAuth>>(getRepositoryToken(TwoFactorAuth));

    mockUser = {
      id: 'user-123',
      username: 'admin',
      displayName: 'Admin User',
      passwordHash: 'hash',
      role: UserRole.ADMIN,
      failedLoginAttempts: 0,
    } as User;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSecret', () => {
    it('should generate secret and QR code', async () => {
      const mockSecret = {
        base32: 'JBSWY3DPEHPK3PXP',
        otpauth_url: 'otpauth://totp/MI%20Campus%20(admin)?secret=JBSWY3DPEHPK3PXP&issuer=MI%20Campus',
      };
      const mockQrCode = 'data:image/png;base64,mock-qr-code';

      jest.spyOn(speakeasy, 'generateSecret').mockReturnValue(mockSecret);
      jest.spyOn(QRCode, 'toDataURL').mockResolvedValue(mockQrCode);

      const result = await service.generateSecret(mockUser);

      expect(speakeasy.generateSecret).toHaveBeenCalledWith({
        name: 'MI Campus (admin)',
        issuer: 'MI Campus',
        length: 32,
      });
      expect(QRCode.toDataURL).toHaveBeenCalledWith(mockSecret.otpauth_url);
      expect(result).toEqual({
        secret: mockSecret.base32,
        qrCode: mockQrCode,
      });
    });
  });

  describe('enrollUser', () => {
    it('should enroll user successfully when not already enrolled', async () => {
      const mockSecret = 'JBSWY3DPEHPK3PXP';
      const mockQrCode = 'data:image/png;base64,mock-qr-code';

      jest.spyOn(service, 'generateSecret').mockResolvedValue({
        secret: mockSecret,
        qrCode: mockQrCode,
      });
      (twoFactorAuthRepo.findOne as jest.Mock).mockResolvedValue(null);
      (twoFactorAuthRepo.save as jest.Mock).mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.enrollUser(mockUser);

      expect(twoFactorAuthRepo.findOne).toHaveBeenCalledWith({ where: { userId: mockUser.id } });
      expect(twoFactorAuthRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          totpSecret: mockSecret,
          backupCodes: expect.any(Array),
          isEnrolled: true,
          isEnabled: false,
        }),
      );
      expect(result).toEqual({
        secret: mockSecret,
        qrCode: mockQrCode,
        backupCodes: expect.any(Array),
      });
    });

    it('should throw error if already enrolled', async () => {
      const existing2fa = {
        id: '2fa-123',
        userId: mockUser.id,
        isEnrolled: true,
      };

      (twoFactorAuthRepo.findOne as jest.Mock).mockResolvedValue(existing2fa);

      await expect(service.enrollUser(mockUser)).rejects.toThrow(new BadRequestException('2FA is already enrolled'));
    });
  });

  describe('enable2fa', () => {
    it('should enable 2FA with valid TOTP code', async () => {
      const mock2fa = {
        id: '2fa-123',
        userId: mockUser.id,
        totpSecret: 'JBSWY3DPEHPK3PXP',
        isEnrolled: true,
        isEnabled: false,
      };

      (twoFactorAuthRepo.findOne as jest.Mock).mockResolvedValue(mock2fa);
      (twoFactorAuthRepo.save as jest.Mock).mockImplementation((entity) => Promise.resolve(entity));
      jest.spyOn(service as any, 'verifyTotp').mockReturnValue(true);

      await service.enable2fa(mockUser, '123456');

      expect(twoFactorAuthRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mock2fa,
          isEnabled: true,
        }),
      );
    });

    it('should throw error if not enrolled', async () => {
      (twoFactorAuthRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.enable2fa(mockUser, '123456')).rejects.toThrow(new BadRequestException('2FA not enrolled'));
    });

    it('should throw error if already enabled', async () => {
      const mock2fa = {
        id: '2fa-123',
        userId: mockUser.id,
        isEnrolled: true,
        isEnabled: true,
      };

      (twoFactorAuthRepo.findOne as jest.Mock).mockResolvedValue(mock2fa);

      await expect(service.enable2fa(mockUser, '123456')).rejects.toThrow(
        new BadRequestException('2FA already enabled'),
      );
    });

    it('should throw error if invalid TOTP code', async () => {
      const mock2fa = {
        id: '2fa-123',
        userId: mockUser.id,
        totpSecret: 'JBSWY3DPEHPK3PXP',
        isEnrolled: true,
        isEnabled: false,
      };

      (twoFactorAuthRepo.findOne as jest.Mock).mockResolvedValue(mock2fa);
      jest.spyOn(service as any, 'verifyTotp').mockReturnValue(false);

      await expect(service.enable2fa(mockUser, '123456')).rejects.toThrow(
        new UnauthorizedException('Invalid TOTP code'),
      );
    });
  });

  describe('disable2fa', () => {
    it('should disable 2FA with valid TOTP code', async () => {
      const mock2fa = {
        id: '2fa-123',
        userId: mockUser.id,
        totpSecret: 'JBSWY3DPEHPK3PXP',
        isEnrolled: true,
        isEnabled: true,
      };

      (twoFactorAuthRepo.findOne as jest.Mock).mockResolvedValue(mock2fa);
      (twoFactorAuthRepo.save as jest.Mock).mockImplementation((entity) => Promise.resolve(entity));
      jest.spyOn(service as any, 'verifyTotp').mockReturnValue(true);

      await service.disable2fa(mockUser, '123456');

      expect(twoFactorAuthRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mock2fa,
          isEnabled: false,
        }),
      );
    });

    it('should throw error if not enabled', async () => {
      const mock2fa = {
        id: '2fa-123',
        userId: mockUser.id,
        isEnrolled: true,
        isEnabled: false,
      };

      (twoFactorAuthRepo.findOne as jest.Mock).mockResolvedValue(mock2fa);

      await expect(service.disable2fa(mockUser, '123456')).rejects.toThrow(new BadRequestException('2FA not enabled'));
    });
  });

  describe('verify2fa', () => {
    it('should return true if 2FA not enabled', async () => {
      (twoFactorAuthRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.verify2fa(mockUser, '123456');

      expect(result).toBe(true);
    });

    it('should verify TOTP code successfully', async () => {
      const mock2fa = {
        id: '2fa-123',
        userId: mockUser.id,
        totpSecret: 'JBSWY3DPEHPK3PXP',
        isEnabled: true,
      };

      (twoFactorAuthRepo.findOne as jest.Mock).mockResolvedValue(mock2fa);
      jest.spyOn(service as any, 'verifyTotp').mockReturnValue(true);

      const result = await service.verify2fa(mockUser, '123456');

      expect(result).toBe(true);
    });

    it('should verify backup code successfully', async () => {
      const mock2fa = {
        id: '2fa-123',
        userId: mockUser.id,
        totpSecret: 'JBSWY3DPEHPK3PXP',
        backupCodes: ['ABC12345', 'DEF67890'],
        isEnabled: true,
      };

      (twoFactorAuthRepo.findOne as jest.Mock).mockResolvedValue(mock2fa);
      (twoFactorAuthRepo.save as jest.Mock).mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.verify2fa(mockUser, 'ABC12345');

      expect(result).toBe(true);
      expect(twoFactorAuthRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          backupCodes: ['DEF67890'],
        }),
      );
    });

    it('should return false for invalid code', async () => {
      const mock2fa = {
        id: '2fa-123',
        userId: mockUser.id,
        totpSecret: 'JBSWY3DPEHPK3PXP',
        isEnabled: true,
      };

      (twoFactorAuthRepo.findOne as jest.Mock).mockResolvedValue(mock2fa);
      jest.spyOn(service as any, 'verifyTotp').mockReturnValue(false);

      const result = await service.verify2fa(mockUser, '123456');

      expect(result).toBe(false);
    });
  });

  describe('generateNewBackupCodes', () => {
    it('should generate new backup codes with valid TOTP', async () => {
      const mock2fa = {
        id: '2fa-123',
        userId: mockUser.id,
        totpSecret: 'JBSWY3DPEHPK3PXP',
        isEnabled: true,
      };

      (twoFactorAuthRepo.findOne as jest.Mock).mockResolvedValue(mock2fa);
      (twoFactorAuthRepo.save as jest.Mock).mockImplementation((entity) => Promise.resolve(entity));
      jest.spyOn(service as any, 'verifyTotp').mockReturnValue(true);

      const result = await service.generateNewBackupCodes(mockUser, '123456');

      expect(result).toHaveLength(10);
      expect(twoFactorAuthRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          backupCodes: result,
        }),
      );
    });

    it('should throw error if 2FA not enabled', async () => {
      const mock2fa = {
        id: '2fa-123',
        userId: mockUser.id,
        isEnrolled: true,
        isEnabled: false,
      };

      (twoFactorAuthRepo.findOne as jest.Mock).mockResolvedValue(mock2fa);

      await expect(service.generateNewBackupCodes(mockUser, '123456')).rejects.toThrow(
        new BadRequestException('2FA not enabled'),
      );
    });
  });

  describe('get2faStatus', () => {
    it('should return status when 2FA exists', async () => {
      const mock2fa = {
        id: '2fa-123',
        userId: mockUser.id,
        isEnrolled: true,
        isEnabled: true,
      };

      (twoFactorAuthRepo.findOne as jest.Mock).mockResolvedValue(mock2fa);

      const result = await service.get2faStatus(mockUser);

      expect(result).toEqual({
        isEnrolled: true,
        isEnabled: true,
      });
    });

    it('should return false status when 2FA does not exist', async () => {
      (twoFactorAuthRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.get2faStatus(mockUser);

      expect(result).toEqual({
        isEnrolled: false,
        isEnabled: false,
      });
    });
  });
});
