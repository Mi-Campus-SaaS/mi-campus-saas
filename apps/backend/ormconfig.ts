import { DataSource, type DataSourceOptions } from 'typeorm';
import { join } from 'path';
import { config } from 'dotenv';
config();

const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
const dbType = (process.env.DB_TYPE || (isProd ? 'postgres' : 'sqlite')).toLowerCase();

const common = {
  entities: [join(__dirname, 'src', '**', '*.entity.{ts,js}')] as Array<string>,
  migrations: [join(__dirname, 'src', 'database', 'migrations', '*.{ts,js}')],
  migrationsTableName: 'typeorm_migrations',
  logging: process.env.TYPEORM_LOGGING === 'true',
};

let options: DataSourceOptions;

if (dbType === 'postgres' || process.env.DATABASE_URL) {
  const sslEnabled = process.env.PG_SSL === 'true' || process.env.DATABASE_SSL === 'true';
  const url = process.env.DATABASE_URL;
  options = url
    ? {
        type: 'postgres',
        url,
        ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
        synchronize: false,
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
        synchronize: false,
        ...common,
      };
} else {
  options = {
    type: 'sqlite',
    database: process.env.DATABASE_PATH || './data/dev.sqlite',
    synchronize: true,
    ...common,
  };
}

export default new DataSource(options);
