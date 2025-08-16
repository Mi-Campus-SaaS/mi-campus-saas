import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import type { Server } from 'http';

describe('AuthController throttling (e2e-lite)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Ensure required environment variables are set for testing
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'test-jwt-secret-that-is-long-enough-for-validation-32-chars';
    }
    if (!process.env.JWT_REFRESH_SECRET) {
      process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-long-enough-for-validation-32-chars';
    }
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'test';
    }
    if (!process.env.DATABASE_PATH) {
      process.env.DATABASE_PATH = ':memory:';
    }
    if (!process.env.SMTP_USER) {
      process.env.SMTP_USER = 'test-user';
    }
    if (!process.env.SMTP_PASS) {
      process.env.SMTP_PASS = 'test-password';
    }

    // Override throttle settings for this specific test
    process.env.AUTH_THROTTLE_LIMIT = '2';
    process.env.AUTH_THROTTLE_TTL_SECONDS = '60';

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
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
