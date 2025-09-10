import { ArrayNotEmpty, IsArray, IsOptional, IsString } from 'class-validator';

export class ReorderScheduleDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids!: string[];

  // Optional day scope for future extension
  @IsOptional()
  @IsString()
  day?: string;
}
