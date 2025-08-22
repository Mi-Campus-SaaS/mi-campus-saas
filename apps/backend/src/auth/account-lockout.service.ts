import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { AppConfig } from '../config/configuration';
import { AuditLogger } from '../common/audit.logger';

@Injectable()
export class AccountLockoutService {
  private readonly config: AppConfig['auth'];

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly audit?: AuditLogger,
  ) {
    this.config = this.configService.get<AppConfig['auth']>('auth')!;
  }

  async checkAccountLocked(user: User): Promise<boolean> {
    if (!user.lockedUntil) {
      return false;
    }

    if (user.lockedUntil.getTime() > Date.now()) {
      return true;
    }

    await this.unlockAccount(user);
    return false;
  }

  async recordFailedLogin(user: User, ip?: string): Promise<void> {
    const now = new Date();
    user.failedLoginAttempts += 1;
    user.lastFailedLoginAt = now;

    if (user.failedLoginAttempts >= this.config.maxFailedAttempts) {
      const lockoutDuration = this.config.lockoutDurationMinutes * 60 * 1000;
      user.lockedUntil = new Date(now.getTime() + lockoutDuration);

      this.audit
        ?.log({
          type: 'auth.account_locked',
          userId: user.id,
          ip: ip ?? undefined,
          metadata: {
            failedAttempts: user.failedLoginAttempts,
            lockoutDuration: this.config.lockoutDurationMinutes,
          },
        })
        .catch(() => {});
    }

    await this.userRepo.save(user);
  }

  async recordSuccessfulLogin(user: User, ip?: string): Promise<void> {
    if (user.failedLoginAttempts > 0) {
      user.failedLoginAttempts = 0;
      user.lockedUntil = undefined;
      user.lastFailedLoginAt = undefined;
      await this.userRepo.save(user);
    }

    this.audit
      ?.log({
        type: 'auth.login_success',
        userId: user.id,
        ip: ip ?? undefined,
      })
      .catch(() => {});
  }

  async unlockAccount(user: User, unlockedBy?: string): Promise<void> {
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    user.lastFailedLoginAt = undefined;
    await this.userRepo.save(user);

    this.audit
      ?.log({
        type: 'auth.account_unlocked',
        userId: user.id,
        metadata: {
          unlockedBy: unlockedBy ?? 'system',
        },
      })
      .catch(() => {});
  }

  async unlockAccountById(userId: string, unlockedBy: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.unlockAccount(user, unlockedBy);
  }

  getRemainingLockoutTime(user: User): number {
    if (!user.lockedUntil) {
      return 0;
    }

    const remaining = user.lockedUntil.getTime() - Date.now();
    return Math.max(0, remaining);
  }

  getFailedAttemptsRemaining(user: User): number {
    return Math.max(0, this.config.maxFailedAttempts - user.failedLoginAttempts);
  }
}
