import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { UserRole } from '../src/common/roles.enum';
import { Teacher } from '../src/teachers/entities/teacher.entity';
import * as bcrypt from 'bcrypt';
import { getDataSourceToken } from '@nestjs/typeorm';
import { resetDatabase } from './test-helpers';

describe('TeachersController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;

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

    const teacherUser = await dataSource.getRepository(User).save({
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

    await dataSource.getRepository(Teacher).save({
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@example.com',
      phone: '1234567890',
      user: teacherUser,
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

  describe('GET /api/teachers', () => {
    it('should return paginated teachers for admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/teachers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('firstName');
      expect(response.body.data[0]).toHaveProperty('lastName');
    });

    it('should support pagination parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/teachers?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(5);
    });

    it('should support search query', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/teachers?q=John')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support sorting', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/teachers?sortBy=lastName&sortDir=asc')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer()).get('/api/teachers').expect(401);
    });

    it('should fail for teacher role', async () => {
      await request(app.getHttpServer())
        .get('/api/teachers')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);
    });

    it('should fail for student role', async () => {
      await request(app.getHttpServer())
        .get('/api/teachers')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });
});
