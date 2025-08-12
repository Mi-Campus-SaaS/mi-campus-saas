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

class GradeItemDto {
  @IsUUID()
  studentId!: string;

  @IsString()
  @Length(1, 200)
  assignmentName!: string;

  @IsNumber()
  @Min(0)
  score!: number;

  @IsNumber()
  @Min(1)
  maxScore!: number;

  @IsDateString()
  date!: string;
}

export class AddGradesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GradeItemDto)
  grades!: GradeItemDto[];
}
