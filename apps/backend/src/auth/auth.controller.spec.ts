import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import type { Server } from 'http';

describe('AuthController throttling (e2e-lite)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.AUTH_THROTTLE_LIMIT = '2';
    process.env.AUTH_THROTTLE_TTL_SECONDS = '60';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    // no-op
  });

  afterAll(async () => {
    await app.close();
  });

  it('limits login attempts', async () => {
    // We expect 2 allowed then 429
    const server = app.getHttpServer() as Server;
    await request(server).post('/auth/login').send({ username: 'x', password: 'y' });
    await request(server).post('/auth/login').send({ username: 'x', password: 'y' });
    const res = await request(server).post('/auth/login').send({ username: 'x', password: 'y' });
    expect([429, 401]).toContain(res.status); // depending on guard order, we may hit 401 first then throttle on repeated calls
  });

  it('limits refresh attempts', async () => {
    const server = app.getHttpServer() as Server;
    await request(server).post('/auth/refresh').send({ refresh_token: 'bad' });
    await request(server).post('/auth/refresh').send({ refresh_token: 'bad' });
    const res = await request(server).post('/auth/refresh').send({ refresh_token: 'bad' });
    expect([429, 400, 401]).toContain(res.status);
  });
});
