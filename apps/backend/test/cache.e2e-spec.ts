import { INestApplication } from '@nestjs/common';
import type { Server } from 'http';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('HTTP cache (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.HTTP_CACHE_TTL_SECONDS = '2';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('sets caching headers and responds 200/304 for students list', async () => {
    const server: Server = app.getHttpServer() as unknown as Server;
    const res1 = await request(server).get('/api/students').set('Authorization', 'Bearer test').expect(200);
    expect(res1.headers['etag']).toBeDefined();
    expect(res1.headers['last-modified']).toBeDefined();
    expect(res1.headers['cache-control']).toContain('max-age=');

    const etag = String(res1.headers['etag']);
    await request(server).get('/api/students').set('If-None-Match', etag).expect(304);
  });
});
