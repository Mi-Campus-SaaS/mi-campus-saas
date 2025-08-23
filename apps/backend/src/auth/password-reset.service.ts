import { Injectable, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { AuditLogger } from '../common/audit.logger';
import { PasswordPolicyService } from './password-policy.service';
import { VerificationToken, TokenType } from './entities/verification-token.entity';
import { RequestPasswordResetDto, ResetPasswordDto } from './dto/password-reset.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class PasswordResetService implements OnModuleInit {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    @InjectRepository(VerificationToken)
    private readonly verificationTokenRepo: Repository<VerificationToken>,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly auditLogger: AuditLogger,
    private readonly passwordPolicyService: PasswordPolicyService,
  ) {}

  async requestPasswordReset(dto: RequestPasswordResetDto, ip: string, userAgent?: string): Promise<void> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      // Don't reveal if email exists or not
      this.logger.warn(`Password reset requested for non-existent email: ${dto.email} from IP: ${ip}`);
      return;
    }

    // Check if there's a recent password reset request (within last 15 minutes)
    const recentToken = await this.verificationTokenRepo.findOne({
      where: { userId: user.id, type: TokenType.PASSWORD_RESET },
      order: { createdAt: 'DESC' },
    });

    if (recentToken && recentToken.createdAt > new Date(Date.now() - 15 * 60 * 1000)) {
      this.logger.warn(`Password reset requested too soon for user: ${user.id} from IP: ${ip}`);
      return;
    }

    // Invalidate any existing password reset tokens
    await this.invalidateExistingTokens(user.id, TokenType.PASSWORD_RESET);

    // Generate new password reset token
    const token = await this.generatePasswordResetToken(user.id);

    // Send password reset email
    await this.sendPasswordResetEmail(user.email!, token.token, user.displayName);

    // Audit log
    await this.auditLogger.log({
      type: 'auth.password_reset_requested',
      userId: user.id,
      requestId: crypto.randomUUID(),
      ip,
      metadata: { email: dto.email, userAgent },
    });

    this.logger.log(`Password reset requested for user: ${user.id}, email: ${dto.email}`);
  }

  async resetPassword(dto: ResetPasswordDto, ip: string, userAgent?: string): Promise<void> {
    const token = await this.verificationTokenRepo.findOne({
      where: { token: dto.token, type: TokenType.PASSWORD_RESET },
      relations: ['user'],
    });

    if (!token) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    if (token.usedAt) {
      await this.auditLogger.log({
        type: 'auth.password_reset_replay_attempt',
        userId: token.userId,
        requestId: crypto.randomUUID(),
        ip,
        metadata: { tokenId: token.id, userAgent },
      });
      throw new BadRequestException('Password reset token has already been used');
    }

    if (token.expiresAt < new Date()) {
      await this.auditLogger.log({
        type: 'auth.password_reset_expired',
        userId: token.userId,
        requestId: crypto.randomUUID(),
        ip,
        metadata: { tokenId: token.id, userAgent },
      });
      throw new BadRequestException('Password reset token has expired');
    }

    // Validate new password against policy
    const passwordValidation = this.passwordPolicyService.validatePassword(dto.newPassword);
    if (!passwordValidation.isValid) {
      await this.auditLogger.log({
        type: 'auth.password_reset_policy_violation',
        userId: token.userId,
        requestId: crypto.randomUUID(),
        ip,
        metadata: { tokenId: token.id, userAgent, errors: passwordValidation.errors },
      });
      throw new BadRequestException(`Password does not meet requirements: ${passwordValidation.errors.join(', ')}`);
    }

    // Mark token as used
    token.usedAt = new Date();
    token.usedFromIp = ip;
    token.usedFromUserAgent = userAgent;
    await this.verificationTokenRepo.save(token);

    // Update user password
    const user = token.user;
    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    user.passwordHash = passwordHash;

    // Reset failed login attempts and unlock account if locked
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    user.lastFailedLoginAt = undefined;

    await this.usersService.update(user.id, user);

    // Audit log
    await this.auditLogger.log({
      type: 'auth.password_reset_success',
      userId: user.id,
      requestId: crypto.randomUUID(),
      ip,
      metadata: { tokenId: token.id, userAgent },
    });

    this.logger.log(`Password reset successful for user: ${user.id}, email: ${user.email}`);
  }

  async onModuleInit(): Promise<void> {
    // Clean up expired tokens on startup
    await this.cleanupExpiredTokens();

    // Set up periodic cleanup (every 6 hours)
    setInterval(
      () => {
        this.cleanupExpiredTokens().catch((error) => {
          this.logger.error('Failed to cleanup expired tokens', error);
        });
      },
      6 * 60 * 60 * 1000,
    );
  }

  private async generatePasswordResetToken(userId: string): Promise<VerificationToken> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const verificationToken = this.verificationTokenRepo.create({
      token,
      type: TokenType.PASSWORD_RESET,
      userId,
      expiresAt,
    });

    return this.verificationTokenRepo.save(verificationToken);
  }

  private async invalidateExistingTokens(userId: string, type: TokenType): Promise<void> {
    await this.verificationTokenRepo.delete({ userId, type });
  }

  private async sendPasswordResetEmail(email: string, token: string, displayName: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const subject = 'Reset Your Password - Mi Campus';
    const text = `
Hello ${displayName},

You have requested to reset your password. Click the link below to set a new password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email and your password will remain unchanged.

Best regards,
Mi Campus Team
    `.trim();

    await this.mailService.sendMail(email, subject, text);
  }

  async cleanupExpiredTokens(): Promise<void> {
    const result = await this.verificationTokenRepo
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .execute();

    if (result.affected && result.affected > 0) {
      this.logger.log(`Cleaned up ${result.affected} expired password reset tokens`);
    }
  }
}
