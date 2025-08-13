import { Body, Controller, HttpCode, Ip, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { LoginDto } from './dto/login.dto';
import { Request as ExpressRequest } from 'express';
import { User } from '../users/entities/user.entity';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Body() _body: LoginDto, @Request() req: ExpressRequest & { user: User }, @Ip() ip: string) {
    return this.authService.login(req.user, ip);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() body: RefreshDto, @Ip() ip: string) {
    return this.authService.refresh(body.refresh_token, ip);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Body() body: LogoutDto, @Ip() ip: string) {
    await this.authService.revoke(body.refresh_token, ip);
  }
}
