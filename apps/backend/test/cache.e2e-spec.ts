import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { Server } from 'http';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { UserRole } from '../src/common/roles.enum';
import * as bcrypt from 'bcrypt';
import { getDataSourceToken } from '@nestjs/typeorm';

describe('HTTP cache (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;

  beforeAll(async () => {
    process.env.HTTP_CACHE_TTL_SECONDS = '2';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    dataSource = app.get(getDataSourceToken());
    await dataSource.query('DELETE FROM "user"');

    const hashedPassword = await bcrypt.hash('Test123!@#', 10);
    await dataSource.getRepository(User).save({
      username: 'cachetest',
      email: 'cache@example.com',
      passwordHash: hashedPassword,
      displayName: 'Cache Test User',
      role: UserRole.ADMIN,
      emailVerified: true,
      twoFactorEnabled: false,
    });

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'cachetest', password: 'Test123!@#' })
      .expect(201);

    accessToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    if (dataSource) {
      await dataSource.query('DELETE FROM "user"');
    }
    await app.close();
  });

  it('sets caching headers and responds 200/304 for students list', async () => {
    const server: Server = app.getHttpServer() as unknown as Server;
    const res1 = await request(server).get('/api/students').set('Authorization', `Bearer ${accessToken}`).expect(200);

    expect(res1.headers['etag']).toBeDefined();
    expect(res1.headers['last-modified']).toBeDefined();
    expect(res1.headers['cache-control']).toContain('max-age=');

    const etag = String(res1.headers['etag']);
    await request(server)
      .get('/api/students')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('If-None-Match', etag)
      .expect(304);
  });
});
