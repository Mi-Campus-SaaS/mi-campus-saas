import { Body, Controller, Get, Post, Query, UseGuards, UseInterceptors, Param, ParseUUIDPipe } from '@nestjs/common';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '../common/roles.enum';
import { RolesGuard } from '../common/roles.guard';
import { CreateStudentDto } from './dto/create-student.dto';
import { PaginationQueryDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { StudentWithGpa } from './dto/student-with-gpa.dto';
import { StudentDetailDto } from './dto/student-detail.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CacheInterceptor, HttpCache } from '../common/cache.interceptor';

@ApiTags('students')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @ApiOperation({
    summary: 'Get all students',
    description: 'Retrieve paginated list of students with GPA calculation. Requires ADMIN or TEACHER role.',
  })
  @ApiResponse({ status: 200, description: 'Students retrieved successfully' })
  @ApiResponse({ status: 304, description: 'Not Modified - cached response is still valid' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @UseInterceptors(CacheInterceptor)
  @HttpCache({ maxAge: 300 }) // Cache for 5 minutes
  @Get()
  findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResponse<StudentWithGpa>> {
    return this.studentsService.findAll(query);
  }

  @ApiOperation({
    summary: 'Get student by ID',
    description: 'Retrieve a single student with GPA snapshots and trend data. Requires ADMIN or TEACHER role.',
  })
  @ApiResponse({ status: 200, description: 'Student retrieved successfully', type: StudentDetailDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @UseInterceptors(CacheInterceptor)
  @HttpCache({ maxAge: 300 }) // Cache for 5 minutes
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<StudentDetailDto> {
    return this.studentsService.findOne(id);
  }

  @ApiOperation({ summary: 'Create student', description: 'Create a new student. Requires ADMIN role.' })
  @ApiResponse({ status: 201, description: 'Student created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() body: CreateStudentDto) {
    return this.studentsService.create(body);
  }
}
