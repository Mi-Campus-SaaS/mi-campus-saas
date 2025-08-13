import { Body, Controller, Get, Param, Post, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '../common/roles.enum';
import { SubmitAttendanceDto } from './dto/submit-attendance.dto';
import { Ownership } from '../common/ownership.decorator';
import { OwnershipGuard } from '../common/ownership.guard';
import { ListSessionAttendanceDto } from './dto/list-session-attendance.dto';

@UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
@Controller()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Roles(UserRole.TEACHER)
  @Ownership({ type: 'classParam', key: 'id' })
  @Post('classes/:id/attendance')
  submit(@Param('id', ParseUUIDPipe) classId: string, @Body() body: SubmitAttendanceDto) {
    return this.attendanceService.submitForClass(classId, body.records || []);
  }

  @Roles(UserRole.TEACHER)
  @Ownership({ type: 'classParam', key: 'classId' })
  @Post('classes/:classId/sessions/:sessionId/attendance')
  submitForSession(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() body: SubmitAttendanceDto,
  ) {
    const records = (body.records || []).map((r) => ({ ...r, sessionId }));
    return this.attendanceService.submitForClass(classId, records);
  }

  @Get('students/:id/attendance')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT)
  @Ownership({ type: 'studentParam', key: 'id' })
  list(@Param('id', ParseUUIDPipe) studentId: string) {
    return this.attendanceService.getForStudent(studentId);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Ownership({ type: 'classParam', key: 'classId' })
  @Get('classes/:classId/sessions/:sessionId/attendance')
  listBySession(@Param('sessionId', ParseUUIDPipe) sessionId: string, @Query() query: ListSessionAttendanceDto) {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    return this.attendanceService.listBySession(sessionId, limit, offset);
  }
}
