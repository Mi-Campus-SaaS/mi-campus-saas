import { Body, Controller, HttpCode, Ip, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { LoginDto } from './dto/login.dto';
import { Request as ExpressRequest } from 'express';
import { User } from '../users/entities/user.entity';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';
import { Throttle } from '@nestjs/throttler';

const AUTH_LIMIT = Number(process.env.AUTH_THROTTLE_LIMIT ?? 5);
const AUTH_TTL = Number(process.env.AUTH_THROTTLE_TTL_SECONDS ?? 60);

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @Throttle({
    default: {
      limit: AUTH_LIMIT,
      ttl: AUTH_TTL,
    },
  })
  async login(@Body() _body: LoginDto, @Request() req: ExpressRequest & { user: User }, @Ip() ip: string) {
    return this.authService.login(req.user, ip);
  }

  @Post('refresh')
  @HttpCode(200)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @Throttle({
    default: {
      limit: AUTH_LIMIT,
      ttl: AUTH_TTL,
    },
  })
  async refresh(@Body() body: RefreshDto, @Ip() ip: string) {
    return this.authService.refresh(body.refresh_token, ip);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Body() body: LogoutDto, @Ip() ip: string) {
    await this.authService.revoke(body.refresh_token, ip);
  }
}
