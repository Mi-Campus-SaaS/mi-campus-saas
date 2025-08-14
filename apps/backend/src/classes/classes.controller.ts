import { Body, Controller, Param, Patch, Post, UseGuards, ParseUUIDPipe, Get, Query } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '../common/roles.enum';
import { CreateClassDto } from './dto/create-class.dto';
import { ClassEntity } from './entities/class.entity';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get()
  list(@Query() query: PaginationQueryDto & { grade?: string }) {
    return this.classesService.findAll(query);
  }

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() body: CreateClassDto) {
    const data: Partial<ClassEntity> = { subjectName: body.subjectName, gradeLevel: body.gradeLevel };
    return this.classesService.createClass(data);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/teacher/:teacherId')
  assign(@Param('id', ParseUUIDPipe) classId: string, @Param('teacherId', ParseUUIDPipe) teacherId: string) {
    return this.classesService.assignTeacher(classId, teacherId);
  }
}
