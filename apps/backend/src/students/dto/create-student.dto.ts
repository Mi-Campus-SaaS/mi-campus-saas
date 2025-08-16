import { IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStudentDto {
  @ApiProperty({ description: 'Student first name', example: 'John' })
  @IsString()
  @Length(1, 100)
  firstName!: string;

  @ApiProperty({ description: 'Student last name', example: 'Doe' })
  @IsString()
  @Length(1, 100)
  lastName!: string;

  @ApiProperty({ description: 'Enrollment status', example: 'active', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  enrollmentStatus?: string;
}
