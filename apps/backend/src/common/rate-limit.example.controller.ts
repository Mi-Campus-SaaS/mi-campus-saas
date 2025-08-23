import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { RateLimitUser, RateLimitIP, RateLimitRoute } from './rate-limit.decorator';
import { RateLimitGuard } from './rate-limit.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('rate-limit-example')
@UseGuards(RateLimitGuard)
export class RateLimitExampleController {
  @Get('user-limited')
  @RateLimitUser(10, 60000) // 10 requests per minute per user
  @UseGuards(JwtAuthGuard)
  getUserLimited() {
    return { message: 'User rate limited endpoint' };
  }

  @Post('ip-limited')
  @RateLimitIP(20, 60000) // 20 requests per minute per IP
  getIpLimited() {
    return { message: 'IP rate limited endpoint' };
  }

  @Get('route-limited')
  @RateLimitRoute(50, 60000) // 50 requests per minute for entire route
  getRouteLimited() {
    return { message: 'Route rate limited endpoint' };
  }

  @Get('strict-user')
  @RateLimitUser(5, 300000) // 5 requests per 5 minutes per user
  @UseGuards(JwtAuthGuard)
  getStrictUserLimited() {
    return { message: 'Strict user rate limited endpoint' };
  }
}
