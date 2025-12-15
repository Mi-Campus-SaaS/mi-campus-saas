import type { ConfigService } from '@nestjs/config';
import type { JwtSignOptions } from '@nestjs/jwt';

type JwtExpiresIn = JwtSignOptions['expiresIn'];

export function getJwtSecret(config: ConfigService): string {
  const secret = config.get<string>('jwtSecret') ?? process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT secret is not configured (jwtSecret / JWT_SECRET).');
  }
  return secret;
}

export function getJwtAccessExpiresIn(config: ConfigService): JwtExpiresIn {
  const raw = config.get<string>('jwtAccessExpiresIn') ?? config.get<string>('jwtExpiresIn') ?? '15m';

  if (/^\d+$/.test(raw)) {
    return Number(raw);
  }

  return raw as JwtExpiresIn;
}
