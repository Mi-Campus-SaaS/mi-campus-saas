import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { GradesService } from './grades.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '../common/roles.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Roles(UserRole.TEACHER)
  @Post('classes/:id/grades')
  add(
    @Param('id') classId: string,
    @Body()
    body: {
      grades: Array<{ studentId: string; assignmentName: string; score: number; maxScore: number; date: string }>;
    },
  ) {
    return this.gradesService.addForClass(classId, body.grades || []);
  }

  @Get('students/:id/gpa')
  gpa(@Param('id') studentId: string) {
    return this.gradesService.calculateStudentGpa(studentId);
  }
}
