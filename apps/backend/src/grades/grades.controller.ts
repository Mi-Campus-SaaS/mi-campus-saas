import { Body, Controller, Get, Param, Post, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { GradesService } from './grades.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '../common/roles.enum';
import { AddGradesDto } from './dto/add-grades.dto';
import { Ownership } from '../common/ownership.decorator';
import { OwnershipGuard } from '../common/ownership.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

@ApiTags('grades')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
@Controller()
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @ApiOperation({
    summary: 'Add grades for class',
    description: 'Add grades for students in a specific class. Requires TEACHER role and class ownership.',
  })
  @ApiParam({ name: 'id', description: 'Class ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 201, description: 'Grades added successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions or not class owner' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  @Roles(UserRole.TEACHER)
  @Ownership({ type: 'classParam', key: 'id' })
  @Post('classes/:id/grades')
  add(@Param('id', ParseUUIDPipe) classId: string, @Body() body: AddGradesDto) {
    return this.gradesService.addForClass(classId, body.grades || []);
  }

  @ApiOperation({
    summary: 'Get student GPA',
    description: 'Calculate and return current GPA for a student. Requires appropriate role and student ownership.',
  })
  @ApiParam({ name: 'id', description: 'Student ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({
    status: 200,
    description: 'GPA calculated successfully',
    schema: { type: 'object', properties: { gpa: { type: 'number', example: 3.75 } } },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions or not student owner' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  @Get('students/:id/gpa')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT)
  @Ownership({ type: 'studentParam', key: 'id' })
  gpa(@Param('id', ParseUUIDPipe) studentId: string) {
    return this.gradesService.calculateStudentGpa(studentId);
  }

  @Post('students/:id/gpa/snapshots')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Ownership({ type: 'studentParam', key: 'id' })
  createSnapshot(@Param('id', ParseUUIDPipe) studentId: string) {
    return this.gradesService.snapshotStudentGpa(studentId);
  }

  @Get('students/:id/gpa/snapshots')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT)
  @Ownership({ type: 'studentParam', key: 'id' })
  listSnapshots(@Param('id', ParseUUIDPipe) studentId: string) {
    return this.gradesService.listStudentSnapshots(studentId);
  }
}
