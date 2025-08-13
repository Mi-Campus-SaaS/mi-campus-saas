import { IsString, Length } from 'class-validator';

export class LogoutDto {
  @IsString()
  @Length(10, 500)
  refresh_token!: string;
}
