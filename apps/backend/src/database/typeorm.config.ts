import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import { config } from 'dotenv';
config();

export const createTypeOrmConfig = (): TypeOrmModuleOptions => {
  const databasePath = process.env.DATABASE_PATH || './data/dev.sqlite';
  return {
    type: 'sqlite',
    database: databasePath,
    entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
    synchronize: true, // Dev only
    logging: false,
  };
};

