import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { UserRole } from '../src/common/roles.enum';
import { Teacher } from '../src/teachers/entities/teacher.entity';
import { ClassEntity } from '../src/classes/entities/class.entity';
import * as bcrypt from 'bcrypt';
import { getDataSourceToken } from '@nestjs/typeorm';
import { resetDatabase } from './test-helpers';

describe('ClassesController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;
  let testClass: ClassEntity;
  let testTeacher: Teacher;

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

    testTeacher = await dataSource.getRepository(Teacher).save({
      firstName: 'Test',
      lastName: 'Teacher',
      email: 'teacher@example.com',
      user: teacherUser,
    });

    testClass = await dataSource.getRepository(ClassEntity).save({
      subjectName: 'Mathematics',
      gradeLevel: 'Grade 10',
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

  describe('GET /api/classes', () => {
    it('should return classes for admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return classes for teacher', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/classes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('should support pagination parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/classes?page=2&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Query parameters are transformed to numbers by ValidationPipe
      expect(Number(response.body.page)).toBe(2);
      expect(Number(response.body.limit)).toBe(10);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
    });

    it('should support grade filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/classes?grade=Grade 10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer()).get('/api/classes').expect(401);
    });

    it('should fail for student role', async () => {
      await request(app.getHttpServer()).get('/api/classes').set('Authorization', `Bearer ${studentToken}`).expect(403);
    });
  });

  describe('POST /api/classes', () => {
    it('should create class for admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          subjectName: 'Science',
          gradeLevel: 'Grade 9',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.subjectName).toBe('Science');
      expect(response.body.gradeLevel).toBe('Grade 9');
    });

    it('should fail with missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          subjectName: 'History',
        })
        .expect(400);
    });

    it('should fail for teacher role', async () => {
      await request(app.getHttpServer())
        .post('/api/classes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          subjectName: 'History',
          gradeLevel: 'Grade 10',
        })
        .expect(403);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/classes')
        .send({
          subjectName: 'History',
          gradeLevel: 'Grade 10',
        })
        .expect(401);
    });
  });

  describe('PATCH /api/classes/:id/teacher/:teacherId', () => {
    it('should assign teacher to class for admin', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/classes/${testClass.id}/teacher/${testTeacher.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('affected');
      expect(response.body.affected).toBeGreaterThanOrEqual(1);
    });

    it('should fail with invalid class UUID', async () => {
      await request(app.getHttpServer())
        .patch(`/api/classes/invalid-id/teacher/${testTeacher.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should fail with invalid teacher UUID', async () => {
      await request(app.getHttpServer())
        .patch(`/api/classes/${testClass.id}/teacher/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should return affected 0 for non-existent class', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/classes/00000000-0000-0000-0000-000000000000/teacher/${testTeacher.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.affected).toBe(0);
    });

    it('should fail for teacher role', async () => {
      await request(app.getHttpServer())
        .patch(`/api/classes/${testClass.id}/teacher/${testTeacher.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer()).patch(`/api/classes/${testClass.id}/teacher/${testTeacher.id}`).expect(401);
    });
  });
});
