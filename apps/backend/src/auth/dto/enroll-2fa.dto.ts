import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Enroll2faDto {
  @ApiProperty({ description: 'TOTP code from authenticator app' })
  @IsString()
  @Length(6, 6)
  totpCode!: string;
}

export class Verify2faDto {
  @ApiProperty({ description: 'TOTP code or backup code' })
  @IsString()
  @Length(6, 8)
  code!: string;
}

export class Enable2faDto {
  @ApiProperty({ description: 'TOTP code to verify enrollment' })
  @IsString()
  @Length(6, 6)
  totpCode!: string;
}

export class Disable2faDto {
  @ApiProperty({ description: 'TOTP code to confirm disable' })
  @IsString()
  @Length(6, 6)
  totpCode!: string;
}

export class GenerateBackupCodesDto {
  @ApiProperty({ description: 'TOTP code to confirm backup code generation' })
  @IsString()
  @Length(6, 6)
  totpCode!: string;
}
