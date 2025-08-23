import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { AuthController } from './auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { TwoFactorAuth } from './entities/two-factor-auth.entity';
import { VerificationToken } from './entities/verification-token.entity';
import { User } from '../users/entities/user.entity';
import { AccountLockoutService } from './account-lockout.service';
import { PasswordPolicyService } from './password-policy.service';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { EmailVerificationService } from './email-verification.service';
import { PasswordResetService } from './password-reset.service';
import { CommonModule } from '../common/common.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    TypeOrmModule.forFeature([RefreshToken, TwoFactorAuth, VerificationToken, User]),
    PassportModule,
    CommonModule,
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwtSecret') || process.env.JWT_SECRET,
        signOptions: {
          expiresIn: config.get<string>('jwtAccessExpiresIn') || config.get<string>('jwtExpiresIn') || '15m',
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    AccountLockoutService,
    PasswordPolicyService,
    TwoFactorAuthService,
    EmailVerificationService,
    PasswordResetService,
  ],
  controllers: [AuthController],
  exports: [AuthService, PasswordPolicyService],
})
export class AuthModule {}
