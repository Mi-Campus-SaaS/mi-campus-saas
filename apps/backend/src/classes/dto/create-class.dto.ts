import { IsOptional, IsString, Length } from 'class-validator';

export class CreateClassDto {
  @IsString()
  @Length(1, 200)
  subjectName!: string;

  @IsString()
  @Length(1, 50)
  gradeLevel!: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  teacherId?: string;
}
