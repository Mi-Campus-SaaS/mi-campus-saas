import { IsOptional, IsString, Length } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @Length(1, 100)
  firstName!: string;

  @IsString()
  @Length(1, 100)
  lastName!: string;

  @IsOptional()
  @IsString()
  @Length(0, 50)
  enrollmentStatus?: string;
}
