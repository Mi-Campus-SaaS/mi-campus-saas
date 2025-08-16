import { Student } from '../entities/student.entity';
import { ApiProperty } from '@nestjs/swagger';

export class StudentWithGpaDto extends Student {
  @ApiProperty({ description: 'Student GPA', example: 3.75, required: false })
  gpa?: number;
}

export interface StudentWithGpa extends Student {
  gpa?: number;
}
