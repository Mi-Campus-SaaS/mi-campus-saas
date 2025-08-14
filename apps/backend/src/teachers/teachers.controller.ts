import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '../common/roles.enum';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Roles(UserRole.ADMIN)
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.teachersService.findAll(query);
  }
}
