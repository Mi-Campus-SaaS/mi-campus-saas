import { IsString, IsEmail, IsOptional, MinLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../common/roles.enum';

export class CreateUserDto {
  @ApiProperty({
    description: 'Username for the user',
    example: 'john.doe',
  })
  @IsString()
  @MinLength(3)
  username!: string;

  @ApiProperty({
    description: 'Email address for the user',
    example: 'john.doe@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Display name for the user',
    example: 'John Doe',
  })
  @IsString()
  @MinLength(2)
  displayName!: string;

  @ApiProperty({
    description: 'Password for the user',
    example: 'SecurePass123!',
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    description: 'Role for the user',
    enum: UserRole,
    example: UserRole.STUDENT,
  })
  @IsEnum(UserRole)
  role!: UserRole;
}
