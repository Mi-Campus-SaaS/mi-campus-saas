import { Body, Controller, Get, Param, Post, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { GradesService } from './grades.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '../common/roles.enum';
import { AddGradesDto } from './dto/add-grades.dto';
import { Ownership } from '../common/ownership.decorator';
import { OwnershipGuard } from '../common/ownership.guard';

@UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
@Controller()
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Roles(UserRole.TEACHER)
  @Ownership({ type: 'classParam', key: 'id' })
  @Post('classes/:id/grades')
  add(@Param('id', ParseUUIDPipe) classId: string, @Body() body: AddGradesDto) {
    return this.gradesService.addForClass(classId, body.grades || []);
  }

  @Get('students/:id/gpa')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT)
  @Ownership({ type: 'studentParam', key: 'id' })
  gpa(@Param('id', ParseUUIDPipe) studentId: string) {
    return this.gradesService.calculateStudentGpa(studentId);
  }
}
