import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/configuration';

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

@Injectable()
export class PasswordPolicyService {
  private readonly config: AppConfig['auth']['passwordPolicy'];

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get<AppConfig['auth']['passwordPolicy']>('auth.passwordPolicy')!;
  }

  validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = [];

    if (password.length < this.config.minLength) {
      errors.push(`Password must be at least ${this.config.minLength} characters long`);
    }

    if (this.config.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (this.config.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (this.config.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (this.config.requireSpecialChars && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  getPasswordRequirements(): string[] {
    const requirements: string[] = [`At least ${this.config.minLength} characters long`];

    if (this.config.requireUppercase) {
      requirements.push('At least one uppercase letter (A-Z)');
    }

    if (this.config.requireLowercase) {
      requirements.push('At least one lowercase letter (a-z)');
    }

    if (this.config.requireNumbers) {
      requirements.push('At least one number (0-9)');
    }

    if (this.config.requireSpecialChars) {
      requirements.push('At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
    }

    return requirements;
  }
}
