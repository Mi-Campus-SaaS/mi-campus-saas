import { IsOptional, IsString, Length, IsUUID } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  @Length(1, 1000)
  content!: string;

  @IsOptional()
  @IsUUID()
  classId?: string; // if provided, targets a class; otherwise global
}
