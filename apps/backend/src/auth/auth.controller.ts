import { Body, Controller, HttpCode, Ip, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { LoginDto } from './dto/login.dto';
import { Request as ExpressRequest } from 'express';
import { User } from '../users/entities/user.entity';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

const AUTH_LIMIT = Number(process.env.AUTH_THROTTLE_LIMIT ?? 5);
const AUTH_TTL = Number(process.env.AUTH_THROTTLE_TTL_SECONDS ?? 60);

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'User login', description: 'Authenticate user with username/email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: { type: 'object', properties: { access_token: { type: 'string' }, refresh_token: { type: 'string' } } },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @Throttle({
    default: {
      limit: AUTH_LIMIT,
      ttl: AUTH_TTL,
    },
  })
  async login(@Body() _body: LoginDto, @Request() req: ExpressRequest & { user: User }, @Ip() ip: string) {
    return this.authService.login(req.user, ip);
  }

  @ApiOperation({ summary: 'Refresh token', description: 'Get new access token using refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    schema: { type: 'object', properties: { access_token: { type: 'string' }, refresh_token: { type: 'string' } } },
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @Post('refresh')
  @HttpCode(200)
  @Throttle({
    default: {
      limit: AUTH_LIMIT,
      ttl: AUTH_TTL,
    },
  })
  async refresh(@Body() body: RefreshDto, @Ip() ip: string) {
    return this.authService.refresh(body.refresh_token, ip);
  }

  @ApiOperation({ summary: 'User logout', description: 'Revoke refresh token' })
  @ApiResponse({ status: 204, description: 'Logout successful' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @Post('logout')
  @HttpCode(204)
  async logout(@Body() body: LogoutDto, @Ip() ip: string) {
    await this.authService.revoke(body.refresh_token, ip);
  }
}
