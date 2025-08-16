import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsUUID,
  Length,
  Min,
  ValidateNested,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class GradeItemDto {
  @ApiProperty({ description: 'Student ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  studentId!: string;

  @ApiProperty({ description: 'Assignment name', example: 'Math Quiz 1' })
  @IsString()
  @Length(1, 200)
  assignmentName!: string;

  @ApiProperty({ description: 'Student score', example: 85, minimum: 0 })
  @IsNumber()
  @Min(0)
  score!: number;

  @ApiProperty({ description: 'Maximum possible score', example: 100, minimum: 1 })
  @IsNumber()
  @Min(1)
  maxScore!: number;

  @ApiProperty({ description: 'Assignment date', example: '2024-01-15' })
  @IsDateString()
  date!: string;
}

export class AddGradesDto {
  @ApiProperty({ description: 'Array of grades to add', type: [GradeItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GradeItemDto)
  grades!: GradeItemDto[];
}
