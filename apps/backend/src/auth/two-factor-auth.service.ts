import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TwoFactorAuth } from './entities/two-factor-auth.entity';
import { User } from '../users/entities/user.entity';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class TwoFactorAuthService {
  constructor(
    @InjectRepository(TwoFactorAuth)
    private readonly twoFactorAuthRepo: Repository<TwoFactorAuth>,
  ) {}

  async generateSecret(user: User): Promise<{ secret: string; qrCode: string }> {
    const secret = speakeasy.generateSecret({
      name: `MI Campus (${user.username})`,
      issuer: 'MI Campus',
      length: 32,
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCode,
    };
  }

  async enrollUser(user: User): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> {
    const existing = await this.twoFactorAuthRepo.findOne({ where: { userId: user.id } });
    if (existing?.isEnrolled) {
      throw new BadRequestException('2FA is already enrolled');
    }

    const { secret, qrCode } = await this.generateSecret(user);
    const backupCodes = this.generateBackupCodes();

    const twoFactorAuth = existing || new TwoFactorAuth();
    twoFactorAuth.userId = user.id;
    twoFactorAuth.totpSecret = secret;
    twoFactorAuth.backupCodes = backupCodes;
    twoFactorAuth.isEnrolled = true;
    twoFactorAuth.isEnabled = false;

    await this.twoFactorAuthRepo.save(twoFactorAuth);

    return { secret, qrCode, backupCodes };
  }

  async enable2fa(user: User, totpCode: string): Promise<void> {
    const twoFactorAuth = await this.getTwoFactorAuth(user.id);
    if (!twoFactorAuth?.isEnrolled) {
      throw new BadRequestException('2FA not enrolled');
    }
    if (twoFactorAuth.isEnabled) {
      throw new BadRequestException('2FA already enabled');
    }

    if (!this.verifyTotp(twoFactorAuth.totpSecret!, totpCode)) {
      throw new UnauthorizedException('Invalid TOTP code');
    }

    twoFactorAuth.isEnabled = true;
    await this.twoFactorAuthRepo.save(twoFactorAuth);
  }

  async disable2fa(user: User, totpCode: string): Promise<void> {
    const twoFactorAuth = await this.getTwoFactorAuth(user.id);
    if (!twoFactorAuth?.isEnabled) {
      throw new BadRequestException('2FA not enabled');
    }

    if (!this.verifyTotp(twoFactorAuth.totpSecret!, totpCode)) {
      throw new UnauthorizedException('Invalid TOTP code');
    }

    twoFactorAuth.isEnabled = false;
    await this.twoFactorAuthRepo.save(twoFactorAuth);
  }

  async verify2fa(user: User, code: string): Promise<boolean> {
    const twoFactorAuth = await this.getTwoFactorAuth(user.id);
    if (!twoFactorAuth?.isEnabled) {
      return true;
    }

    if (code.length === 6) {
      return this.verifyTotp(twoFactorAuth.totpSecret!, code);
    } else if (code.length === 8) {
      return await this.verifyBackupCode(twoFactorAuth, code);
    }

    return false;
  }

  async generateNewBackupCodes(user: User, totpCode: string): Promise<string[]> {
    const twoFactorAuth = await this.getTwoFactorAuth(user.id);
    if (!twoFactorAuth?.isEnabled) {
      throw new BadRequestException('2FA not enabled');
    }

    if (!this.verifyTotp(twoFactorAuth.totpSecret!, totpCode)) {
      throw new UnauthorizedException('Invalid TOTP code');
    }

    const backupCodes = this.generateBackupCodes();
    twoFactorAuth.backupCodes = backupCodes;
    await this.twoFactorAuthRepo.save(twoFactorAuth);

    return backupCodes;
  }

  async get2faStatus(user: User): Promise<{ isEnrolled: boolean; isEnabled: boolean }> {
    const twoFactorAuth = await this.getTwoFactorAuth(user.id);
    return {
      isEnrolled: twoFactorAuth?.isEnrolled ?? false,
      isEnabled: twoFactorAuth?.isEnabled ?? false,
    };
  }

  private async getTwoFactorAuth(userId: string): Promise<TwoFactorAuth | null> {
    return this.twoFactorAuthRepo.findOne({ where: { userId } });
  }

  private verifyTotp(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1,
    });
  }

  private async verifyBackupCode(twoFactorAuth: TwoFactorAuth, code: string): Promise<boolean> {
    if (!twoFactorAuth.backupCodes?.includes(code)) {
      return false;
    }

    twoFactorAuth.backupCodes = twoFactorAuth.backupCodes.filter((c) => c !== code);
    await this.twoFactorAuthRepo.save(twoFactorAuth);
    return true;
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }
}
