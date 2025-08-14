import { Injectable, UnauthorizedException, BadRequestException, Optional } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { AuditLogger } from '../common/audit.logger';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    @Optional() private readonly audit?: AuditLogger,
  ) {}

  async validateUser(username: string, pass: string): Promise<User | null> {
    const user = await this.usersService.findByUsername(username);
    if (!user) return null;
    const match = await bcrypt.compare(pass, user.passwordHash);
    if (match) return user;
    return null;
  }

  private hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  private async generateAccessToken(user: User): Promise<string> {
    const payload = { sub: user.id, username: user.username, role: user.role };
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwtSecret') || process.env.JWT_SECRET,
      expiresIn:
        this.configService.get<string>('jwtAccessExpiresIn') || this.configService.get<string>('jwtExpiresIn') || '15m',
    });
  }

  private async issueRefreshToken(
    user: User,
    ip?: string | null,
  ): Promise<{ id: string; token: string; expiresAt: Date }> {
    const expiresIn = this.configService.get<string>('jwtRefreshExpiresIn') || '7d';
    const rawToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + this.parseExpiryToMs(expiresIn));
    const entity = this.refreshTokenRepo.create({
      user,
      tokenHash,
      expiresAt,
      createdByIp: ip ?? null,
    });
    const saved = await this.refreshTokenRepo.save(entity);
    return { id: saved.id, token: `${saved.id}.${rawToken}`, expiresAt };
  }

  private parseExpiryToMs(expiry: string): number {
    const regex = /^(\d+)([smhdw])$/i;
    const match = regex.exec(expiry);
    if (!match) return 0;
    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    const multipliers: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000 };
    return value * multipliers[unit];
  }

  async login(user: User, ip?: string | null) {
    if (!user) throw new UnauthorizedException();
    const accessToken = await this.generateAccessToken(user);
    const { token: refreshToken } = await this.issueRefreshToken(user, ip);
    this.audit?.log({ type: 'auth.login', userId: user.id, ip: ip ?? undefined });
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        displayName: user.displayName,
      },
    };
  }

  async refresh(oldToken: string, ip?: string | null) {
    const [id, raw] = oldToken.split('.', 2);
    if (!id || !raw) throw new BadRequestException('Invalid token');
    const token = await this.refreshTokenRepo.findOne({ where: { id } });
    if (!token) throw new UnauthorizedException('Token not found');
    if (token.revokedAt) throw new UnauthorizedException('Token revoked');
    if (token.expiresAt.getTime() < Date.now()) throw new UnauthorizedException('Token expired');
    const expectedHash = this.hashToken(raw);
    if (token.tokenHash !== expectedHash) throw new UnauthorizedException('Token mismatch');

    // rotate: revoke current, create new
    token.revokedAt = new Date();
    token.revokedReason = 'rotated';
    token.revokedByIp = ip ?? null;
    await this.refreshTokenRepo.save(token);

    const user = token.user;
    const accessToken = await this.generateAccessToken(user);
    const { id: newId, token: newRefresh } = await this.issueRefreshToken(user, ip);
    token.replacedByTokenId = newId;
    await this.refreshTokenRepo.save(token);

    const result = {
      access_token: accessToken,
      refresh_token: newRefresh,
    };
    this.audit?.log({ type: 'auth.refresh', userId: user.id, ip: ip ?? undefined });
    return result;
  }

  async revoke(tokenString: string, ip?: string | null): Promise<void> {
    const [id, raw] = tokenString.split('.', 2);
    if (!id || !raw) throw new BadRequestException('Invalid token');
    const token = await this.refreshTokenRepo.findOne({ where: { id } });
    if (!token) return; // already gone
    if (token.revokedAt) return;
    const expectedHash = this.hashToken(raw);
    if (token.tokenHash !== expectedHash) return;
    token.revokedAt = new Date();
    token.revokedReason = 'logout';
    token.revokedByIp = ip ?? null;
    await this.refreshTokenRepo.save(token);
    this.audit?.log({ type: 'auth.logout', userId: token.user?.id, ip: ip ?? undefined });
  }
}
