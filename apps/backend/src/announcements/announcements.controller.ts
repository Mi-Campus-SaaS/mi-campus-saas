import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '../common/roles.enum';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { ClassEntity } from '../classes/entities/class.entity';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Post()
  create(@Body() body: CreateAnnouncementDto) {
    return this.announcementsService.create({
      content: body.content,
      classEntity: body.classId ? ({ id: body.classId } as unknown as ClassEntity) : undefined,
      publishAt: body.publishAt ? new Date(body.publishAt) : new Date(),
    });
  }

  @Get()
  list() {
    return this.announcementsService.list();
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateAnnouncementDto) {
    return this.announcementsService.update(id, {
      content: body.content,
      classEntity: body.classId ? ({ id: body.classId } as unknown as ClassEntity) : undefined,
      publishAt: body.publishAt ? new Date(body.publishAt) : undefined,
    });
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.announcementsService.remove(id);
    return { status: 'ok' };
  }
}
