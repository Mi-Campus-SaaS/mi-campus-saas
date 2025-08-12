import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '../common/roles.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Roles(UserRole.TEACHER)
  @Post('classes/:id/attendance')
  submit(
    @Param('id') classId: string,
    @Body() body: { records: Array<{ studentId: string; present: boolean; date: string }> },
  ) {
    return this.attendanceService.submitForClass(classId, body.records || []);
  }

  @Get('students/:id/attendance')
  list(@Param('id') studentId: string) {
    return this.attendanceService.getForStudent(studentId);
  }
}
