import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '../common/roles.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() body: any) {
    return this.classesService.createClass(body);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/teacher/:teacherId')
  assign(@Param('id') classId: string, @Param('teacherId') teacherId: string) {
    return this.classesService.assignTeacher(classId, teacherId);
  }
}
