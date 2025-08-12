import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '../common/roles.enum';
import { RolesGuard } from '../common/roles.guard';
import { CreateStudentDto } from './dto/create-student.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  findAll() {
    return this.studentsService.findAll();
  }

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() body: CreateStudentDto) {
    return this.studentsService.create(body);
  }
}
