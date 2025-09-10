import { Controller, Get, Param, UseGuards, ParseUUIDPipe, Patch, Body, Header } from '@nestjs/common';
import { ScheduleService, ScheduleItem } from './schedule.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { OwnershipGuard } from '../common/ownership.guard';
import { Ownership } from '../common/ownership.decorator';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '../common/roles.enum';
// Removed CacheInterceptor for demo endpoint to avoid caching
import { ReorderScheduleDto } from './dto/reorder-schedule.dto';

@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get('student/demo')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  demo(): ScheduleItem[] {
    return this.scheduleService.getDemoSchedule();
  }

  // Demo-only endpoint to reorder the in-memory schedule list
  @Patch('student/demo/reorder')
  reorderDemo(@Body() dto: ReorderScheduleDto): ScheduleItem[] {
    return this.scheduleService.reorderDemo(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.PARENT)
  @Ownership({ type: 'studentParam', key: 'id' })
  @Get('student/:id')
  student(@Param('id', ParseUUIDPipe) id: string) {
    return this.scheduleService.forStudent(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Ownership({ type: 'teacherParam', key: 'id' })
  @Get('teacher/:id')
  teacher(@Param('id', ParseUUIDPipe) id: string) {
    return this.scheduleService.forTeacher(id);
  }
}
