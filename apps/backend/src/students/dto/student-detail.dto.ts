import { ApiProperty } from '@nestjs/swagger';

export class GpaTrendPoint {
  @ApiProperty({ description: 'Date when GPA was calculated' })
  date!: Date;

  @ApiProperty({ description: 'GPA value at this date' })
  gpa!: number;
}

export class StudentDetailDto {
  @ApiProperty({ description: 'Student ID' })
  id!: string;

  @ApiProperty({ description: 'Student first name' })
  firstName!: string;

  @ApiProperty({ description: 'Student last name' })
  lastName!: string;

  @ApiProperty({ description: 'Student enrollment status', required: false })
  enrollmentStatus?: string;

  @ApiProperty({ description: 'Current calculated GPA' })
  currentGpa!: number;

  @ApiProperty({ description: 'GPA trend over time', type: [GpaTrendPoint] })
  gpaTrend!: GpaTrendPoint[];

  @ApiProperty({ description: 'Creation date' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update date', nullable: true })
  updatedAt!: Date | null;
}
