import { IsOptional, IsString, Length } from 'class-validator';

export class UploadMaterialDto {
  @IsString()
  @Length(1, 200)
  title!: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;
}
