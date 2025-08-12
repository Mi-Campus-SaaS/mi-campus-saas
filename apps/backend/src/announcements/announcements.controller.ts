import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '../common/roles.enum';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { ClassEntity } from '../classes/entities/class.entity';

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
    });
  }

  @Get()
  list() {
    return this.announcementsService.list();
  }
}
