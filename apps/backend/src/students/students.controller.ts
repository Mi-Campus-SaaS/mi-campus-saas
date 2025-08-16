import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '../common/roles.enum';
import { RolesGuard } from '../common/roles.guard';
import { CreateStudentDto } from './dto/create-student.dto';
import { PaginationQueryDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { StudentWithGpa } from './dto/student-with-gpa.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get()
  findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResponse<StudentWithGpa>> {
    return this.studentsService.findAll(query);
  }

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() body: CreateStudentDto) {
    return this.studentsService.create(body);
  }
}
