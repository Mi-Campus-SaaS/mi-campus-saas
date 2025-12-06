import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Sse,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Observable, interval, map, merge } from 'rxjs';
import { map as rxMap } from 'rxjs/operators';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AnnouncementsService } from './announcements.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '../common/roles.enum';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { ClassEntity } from '../classes/entities/class.entity';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { CacheInterceptor, HttpCache } from '../common/cache.interceptor';

@Controller('announcements')
export class AnnouncementsController {
  constructor(
    private readonly announcementsService: AnnouncementsService,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Post()
  create(@Body() body: CreateAnnouncementDto) {
    return this.announcementsService.create({
      content: body.content,
      classEntity: body.classId ? ({ id: body.classId } as unknown as ClassEntity) : undefined,
      publishAt: body.publishAt ? new Date(body.publishAt) : new Date(),
    });
  }

  @UseInterceptors(CacheInterceptor)
  @HttpCache({ maxAge: 180 }) // Cache for 3 minutes (announcements change more frequently)
  @Get()
  list(@Query() query: import('../common/dto/pagination.dto').PaginationQueryDto) {
    return this.announcementsService.list(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateAnnouncementDto) {
    return this.announcementsService.update(id, {
      content: body.content,
      classEntity: body.classId ? ({ id: body.classId } as unknown as ClassEntity) : undefined,
      publishAt: body.publishAt ? new Date(body.publishAt) : undefined,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('queue/metrics')
  getQueueMetrics() {
    return this.announcementsService.getQueueMetrics();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('queue/completed')
  async clearCompletedJobs() {
    const count = await this.announcementsService.clearCompletedJobs();
    return { cleared: count };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('queue/failed')
  async clearFailedJobs() {
    const count = await this.announcementsService.clearFailedJobs();
    return { cleared: count };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get(':id/queue/status')
  getJobStatus(@Param('id') id: string) {
    return this.announcementsService.getJobStatus(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.announcementsService.remove(id);
    return { status: 'ok' };
  }

  // Server-Sent Events stream for announcements changes
  // Emits a keepalive every 25s and a generic updated signal to let clients refetch
  @Sse('stream')
  stream(@Req() req: Request): Observable<{ data: unknown }> {
    // Manual JWT verification to support EventSource without custom headers
    const authHeader = req.headers['authorization'];
    let bearer: string | undefined;
    if (typeof authHeader === 'string') {
      bearer = authHeader;
    } else if (Array.isArray(authHeader)) {
      bearer = authHeader[0];
    }

    let token: string | undefined;
    if (bearer?.startsWith('Bearer ')) {
      token = bearer.slice('Bearer '.length);
    } else if (typeof req.query['access_token'] === 'string') {
      token = req.query['access_token'];
    }
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException();
    }
    const keepalive$ = interval(25_000).pipe(map(() => ({ type: 'keepalive', at: Date.now() })));
    const events$ = this.announcementsService.getEventsStream().pipe(rxMap((e) => e));
    return merge(keepalive$, events$).pipe(map((data) => ({ data })));
  }
}
