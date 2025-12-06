import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from './auth.service';
import { Request } from 'express';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ passReqToCallback: true });
  }

  async validate(req: Request, username: string, password: string) {
    const forwardedHeader = req.headers['x-forwarded-for'];
    let forwarded: string | undefined;
    if (typeof forwardedHeader === 'string') {
      forwarded = forwardedHeader.split(',')[0]?.trim();
    } else if (Array.isArray(forwardedHeader) && forwardedHeader.length > 0) {
      forwarded = typeof forwardedHeader[0] === 'string' ? forwardedHeader[0].split(',')[0]?.trim() : undefined;
    }
    const ip = forwarded || req.ip || req.socket?.remoteAddress || 'unknown';
    const user = await this.authService.validateUser(username, password, ip);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
}
