import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestEmailVerificationDto {
  @ApiProperty({ description: 'Email address to verify' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

export class VerifyEmailDto {
  @ApiProperty({ description: 'Verification token' })
  @IsString()
  @IsNotEmpty()
  token!: string;
}

export class ResendEmailVerificationDto {
  @ApiProperty({ description: 'Email address to resend verification to' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

export class EmailVerificationResponseDto {
  @ApiProperty({ description: 'Success message' })
  message!: string;
}
