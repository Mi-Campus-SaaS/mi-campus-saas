import { Body, Controller, Get, Param, Post, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '../common/roles.enum';
import { SubmitAttendanceDto } from './dto/submit-attendance.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Roles(UserRole.TEACHER)
  @Post('classes/:id/attendance')
  submit(@Param('id', ParseUUIDPipe) classId: string, @Body() body: SubmitAttendanceDto) {
    return this.attendanceService.submitForClass(classId, body.records || []);
  }

  @Get('students/:id/attendance')
  list(@Param('id', ParseUUIDPipe) studentId: string) {
    return this.attendanceService.getForStudent(studentId);
  }
}
