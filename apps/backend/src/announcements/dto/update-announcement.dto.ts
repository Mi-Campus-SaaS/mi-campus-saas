import { IsDateString, IsOptional, IsString, Length, IsUUID } from 'class-validator';

export class UpdateAnnouncementDto {
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  content?: string;

  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsDateString()
  publishAt?: string;
}
