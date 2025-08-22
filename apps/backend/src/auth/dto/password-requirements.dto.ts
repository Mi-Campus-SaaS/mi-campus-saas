import { ApiProperty } from '@nestjs/swagger';

export class PasswordRequirementsDto {
  @ApiProperty({
    description: 'List of password requirements',
    example: [
      'At least 8 characters long',
      'At least one uppercase letter (A-Z)',
      'At least one lowercase letter (a-z)',
      'At least one number (0-9)',
      'At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)',
    ],
  })
  requirements!: string[];
}
