import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get('student/:id')
  student(@Param('id') id: string) {
    return this.scheduleService.forStudent(id);
  }

  @Get('teacher/:id')
  teacher(@Param('id') id: string) {
    return this.scheduleService.forTeacher(id);
  }
}

