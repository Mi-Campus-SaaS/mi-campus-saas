import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { UserRole } from '../src/common/roles.enum';
import { Announcement } from '../src/announcements/entities/announcement.entity';
import * as bcrypt from 'bcrypt';
import { getDataSourceToken } from '@nestjs/typeorm';
import { resetDatabase } from './test-helpers';

describe('AnnouncementsController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;
  let testAnnouncement: Announcement;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    dataSource = app.get(getDataSourceToken());
    await resetDatabase(dataSource);

    const hashedPassword = await bcrypt.hash('Test123!@#', 10);

    await dataSource.getRepository(User).save({
      username: 'admin',
      email: 'admin@example.com',
      passwordHash: hashedPassword,
      displayName: 'Admin User',
      role: UserRole.ADMIN,
      emailVerified: true,
    });

    await dataSource.getRepository(User).save({
      username: 'teacher',
      email: 'teacher@example.com',
      passwordHash: hashedPassword,
      displayName: 'Teacher User',
      role: UserRole.TEACHER,
      emailVerified: true,
    });

    await dataSource.getRepository(User).save({
      username: 'student',
      email: 'student@example.com',
      passwordHash: hashedPassword,
      displayName: 'Student User',
      role: UserRole.STUDENT,
      emailVerified: true,
    });

    testAnnouncement = await dataSource.getRepository(Announcement).save({
      content: 'Test announcement',
      publishAt: new Date(),
    });

    const adminLoginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'Test123!@#' });
    adminToken = adminLoginResponse.body.access_token;

    const teacherLoginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'teacher', password: 'Test123!@#' });
    teacherToken = teacherLoginResponse.body.access_token;

    const studentLoginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'student', password: 'Test123!@#' });
    studentToken = studentLoginResponse.body.access_token;
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('GET /api/announcements', () => {
    it('should list announcements without authentication', async () => {
      const response = await request(app.getHttpServer()).get('/api/announcements').expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support pagination parameters', async () => {
      const response = await request(app.getHttpServer()).get('/api/announcements?page=2&limit=10').expect(200);

      expect(Number(response.body.page)).toBe(2);
      expect(Number(response.body.limit)).toBe(10);
    });

    it('should support search query', async () => {
      const response = await request(app.getHttpServer()).get('/api/announcements?q=test').expect(200);

      expect(response.body).toHaveProperty('data');
    });
  });

  describe('POST /api/announcements', () => {
    it('should create announcement for admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/announcements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          content: 'New announcement from admin',
          publishAt: new Date().toISOString(),
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.content).toBe('New announcement from admin');
    });

    it('should create announcement for teacher', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/announcements')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          content: 'New announcement from teacher',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should fail with missing content', async () => {
      await request(app.getHttpServer())
        .post('/api/announcements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);
    });

    it('should fail for student role', async () => {
      await request(app.getHttpServer())
        .post('/api/announcements')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          content: 'Unauthorized announcement',
        })
        .expect(403);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/announcements')
        .send({
          content: 'No auth announcement',
        })
        .expect(401);
    });
  });

  describe('PATCH /api/announcements/:id', () => {
    it('should update announcement for admin', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/announcements/${testAnnouncement.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          content: 'Updated announcement',
        })
        .expect(200);

      expect(response.body.content).toBe('Updated announcement');
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .patch(`/api/announcements/${testAnnouncement.id}`)
        .send({
          content: 'Updated',
        })
        .expect(401);
    });

    it('should fail for student role', async () => {
      await request(app.getHttpServer())
        .patch(`/api/announcements/${testAnnouncement.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          content: 'Updated',
        })
        .expect(403);
    });
  });

  describe('DELETE /api/announcements/:id', () => {
    it('should delete announcement for admin', async () => {
      const newAnnouncement = await dataSource.getRepository(Announcement).save({
        content: 'To be deleted',
        publishAt: new Date(),
      });

      const response = await request(app.getHttpServer())
        .delete(`/api/announcements/${newAnnouncement.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('ok');
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer()).delete(`/api/announcements/${testAnnouncement.id}`).expect(401);
    });

    it('should fail for student role', async () => {
      await request(app.getHttpServer())
        .delete(`/api/announcements/${testAnnouncement.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });

  describe('Queue management endpoints', () => {
    it('should get queue metrics for admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/announcements/queue/metrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('waiting');
      expect(response.body).toHaveProperty('active');
      expect(response.body).toHaveProperty('completed');
      expect(response.body).toHaveProperty('failed');
    });

    it('should fail queue metrics for teacher', async () => {
      await request(app.getHttpServer())
        .get('/api/announcements/queue/metrics')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);
    });

    it('should clear completed jobs for admin', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/announcements/queue/completed')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('cleared');
      expect(typeof response.body.cleared).toBe('number');
    });

    it('should clear failed jobs for admin', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/announcements/queue/failed')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('cleared');
    });
  });
});
