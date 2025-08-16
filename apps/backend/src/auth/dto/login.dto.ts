import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'Username or email', example: 'admin@example.com' })
  @IsString()
  @Length(1, 100)
  username!: string;

  @ApiProperty({ description: 'Password', example: 'password123' })
  @IsString()
  @Length(1, 200)
  password!: string;
}
