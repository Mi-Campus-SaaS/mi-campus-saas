import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
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
  constructor(private readonly announcementsService: AnnouncementsService) {}

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
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.announcementsService.remove(id);
    return { status: 'ok' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('queue/metrics')
  getQueueMetrics() {
    return this.announcementsService.getQueueMetrics();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get(':id/queue/status')
  getJobStatus(@Param('id') id: string) {
    return this.announcementsService.getJobStatus(id);
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
}
