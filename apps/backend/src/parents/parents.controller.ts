import { Controller, Delete, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ParentsService } from './parents.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '../common/roles.enum';
import { OwnershipGuard } from '../common/ownership.guard';
import { Ownership } from '../common/ownership.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
@Controller('parents')
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Roles(UserRole.ADMIN, UserRole.PARENT)
  @Get(':id/children')
  @Ownership({ type: 'parentParam', key: 'id' })
  list(@Param('id', ParseUUIDPipe) id: string) {
    return this.parentsService.listChildren(id);
  }

  @Roles(UserRole.ADMIN)
  @Post(':parentId/children/:studentId')
  link(@Param('parentId', ParseUUIDPipe) parentId: string, @Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.parentsService.linkChild(parentId, studentId);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':parentId/children/:studentId')
  unlink(@Param('parentId', ParseUUIDPipe) parentId: string, @Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.parentsService.unlinkChild(parentId, studentId);
  }
}
