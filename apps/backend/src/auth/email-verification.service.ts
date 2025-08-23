import { Injectable, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { AuditLogger } from '../common/audit.logger';
import { VerificationToken, TokenType } from './entities/verification-token.entity';
import { RequestEmailVerificationDto, VerifyEmailDto, ResendEmailVerificationDto } from './dto/email-verification.dto';
import * as crypto from 'crypto';

@Injectable()
export class EmailVerificationService implements OnModuleInit {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(
    @InjectRepository(VerificationToken)
    private readonly verificationTokenRepo: Repository<VerificationToken>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly auditLogger: AuditLogger,
  ) {}

  async requestEmailVerification(dto: RequestEmailVerificationDto, ip: string, userAgent?: string): Promise<void> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      // Don't reveal if email exists or not
      this.logger.warn(`Email verification requested for non-existent email: ${dto.email} from IP: ${ip}`);
      return;
    }

    if (user.emailVerified) {
      this.logger.warn(`Email verification requested for already verified email: ${dto.email} from IP: ${ip}`);
      return;
    }

    // Invalidate any existing verification tokens
    await this.invalidateExistingTokens(user.id, TokenType.EMAIL_VERIFICATION);

    // Generate new verification token
    const token = await this.generateVerificationToken(user.id, TokenType.EMAIL_VERIFICATION);

    // Send verification email
    await this.sendVerificationEmail(user.email!, token.token, user.displayName);

    // Audit log
    await this.auditLogger.log({
      type: 'auth.email_verification_requested',
      userId: user.id,
      requestId: crypto.randomUUID(),
      ip,
      metadata: { email: dto.email, userAgent },
    });

    this.logger.log(`Email verification requested for user: ${user.id}, email: ${dto.email}`);
  }

  async verifyEmail(dto: VerifyEmailDto, ip: string, userAgent?: string): Promise<void> {
    const token = await this.verificationTokenRepo.findOne({
      where: { token: dto.token, type: TokenType.EMAIL_VERIFICATION },
      relations: ['user'],
    });

    if (!token) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (token.usedAt) {
      await this.auditLogger.log({
        type: 'auth.email_verification_replay_attempt',
        userId: token.userId,
        requestId: crypto.randomUUID(),
        ip,
        metadata: { tokenId: token.id, userAgent },
      });
      throw new BadRequestException('Verification token has already been used');
    }

    if (token.expiresAt < new Date()) {
      await this.auditLogger.log({
        type: 'auth.email_verification_expired',
        userId: token.userId,
        requestId: crypto.randomUUID(),
        ip,
        metadata: { tokenId: token.id, userAgent },
      });
      throw new BadRequestException('Verification token has expired');
    }

    // Mark token as used
    token.usedAt = new Date();
    token.usedFromIp = ip;
    token.usedFromUserAgent = userAgent;
    await this.verificationTokenRepo.save(token);

    // Mark user email as verified
    const user = token.user;
    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    await this.usersService.update(user.id, user);

    // Audit log
    await this.auditLogger.log({
      type: 'auth.email_verification_success',
      userId: user.id,
      requestId: crypto.randomUUID(),
      ip,
      metadata: { tokenId: token.id, userAgent },
    });

    this.logger.log(`Email verified for user: ${user.id}, email: ${user.email}`);
  }

  async resendEmailVerification(dto: ResendEmailVerificationDto, ip: string, userAgent?: string): Promise<void> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      // Don't reveal if email exists or not
      this.logger.warn(`Email verification resend requested for non-existent email: ${dto.email} from IP: ${ip}`);
      return;
    }

    if (user.emailVerified) {
      this.logger.warn(`Email verification resend requested for already verified email: ${dto.email} from IP: ${ip}`);
      return;
    }

    // Check if there's a recent token (within last 5 minutes)
    const recentToken = await this.verificationTokenRepo.findOne({
      where: { userId: user.id, type: TokenType.EMAIL_VERIFICATION },
      order: { createdAt: 'DESC' },
    });

    if (recentToken && recentToken.createdAt > new Date(Date.now() - 5 * 60 * 1000)) {
      this.logger.warn(`Email verification resend requested too soon for user: ${user.id} from IP: ${ip}`);
      return;
    }

    // Invalidate any existing verification tokens
    await this.invalidateExistingTokens(user.id, TokenType.EMAIL_VERIFICATION);

    // Generate new verification token
    const token = await this.generateVerificationToken(user.id, TokenType.EMAIL_VERIFICATION);

    // Send verification email
    await this.sendVerificationEmail(user.email!, token.token, user.displayName);

    // Audit log
    await this.auditLogger.log({
      type: 'auth.email_verification_resent',
      userId: user.id,
      requestId: crypto.randomUUID(),
      ip,
      metadata: { email: dto.email, userAgent },
    });

    this.logger.log(`Email verification resent for user: ${user.id}, email: ${dto.email}`);
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

  private async generateVerificationToken(userId: string, type: TokenType): Promise<VerificationToken> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const verificationToken = this.verificationTokenRepo.create({
      token,
      type,
      userId,
      expiresAt,
    });

    return this.verificationTokenRepo.save(verificationToken);
  }

  private async invalidateExistingTokens(userId: string, type: TokenType): Promise<void> {
    await this.verificationTokenRepo.delete({ userId, type });
  }

  private async sendVerificationEmail(email: string, token: string, displayName: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

    const subject = 'Verify Your Email - Mi Campus';
    const text = `
Hello ${displayName},

Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

If you didn't request this verification, please ignore this email.

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
      this.logger.log(`Cleaned up ${result.affected} expired verification tokens`);
    }
  }
}
