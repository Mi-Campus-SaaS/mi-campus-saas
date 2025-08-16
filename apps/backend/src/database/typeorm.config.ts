import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import { config } from 'dotenv';
config();

export const createTypeOrmConfig = (): TypeOrmModuleOptions => {
  const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
  const dbType = (process.env.DB_TYPE || (isProd ? 'postgres' : 'sqlite')).toLowerCase();

  const common = {
    entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')] as Array<string>,
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    migrationsTableName: 'typeorm_migrations',
    logging: process.env.TYPEORM_LOGGING === 'true',
  };

  if (dbType === 'postgres' || process.env.DATABASE_URL) {
    const sslEnabled = process.env.PG_SSL === 'true' || process.env.DATABASE_SSL === 'true';
    const url = process.env.DATABASE_URL;
    const cfg: TypeOrmModuleOptions = url
      ? {
          type: 'postgres',
          url,
          ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
          synchronize: process.env.NODE_ENV === 'test',
          ...common,
        }
      : {
          type: 'postgres',
          host: process.env.PGHOST || 'localhost',
          port: Number(process.env.PGPORT || 5432),
          username: process.env.PGUSER || 'postgres',
          password: process.env.PGPASSWORD || 'postgres',
          database: process.env.PGDATABASE || 'micampus',
          ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
          synchronize: process.env.NODE_ENV === 'test',
          ...common,
        };
    return cfg;
  }

  // Default: SQLite for local/dev
  const sqlite: TypeOrmModuleOptions = {
    type: 'sqlite',
    database: process.env.DATABASE_PATH || './data/dev.sqlite',
    synchronize: true,
    ...common,
  };
  return sqlite;
};
