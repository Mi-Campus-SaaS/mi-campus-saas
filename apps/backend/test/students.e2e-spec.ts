import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { Student } from '../src/students/entities/student.entity';
import { UserRole } from '../src/common/roles.enum';
import * as bcrypt from 'bcrypt';
import { getDataSourceToken } from '@nestjs/typeorm';
import { resetDatabase } from './test-helpers';

describe('StudentsController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;
  let testStudent: Student;

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

    testStudent = await dataSource.getRepository(Student).save({
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('2010-01-01'),
      enrollmentDate: new Date('2024-09-01'),
      guardianName: 'Jane Doe',
      guardianPhone: '1234567890',
      guardianEmail: 'jane@example.com',
      gradeLevel: 'Grade 10',
    });
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('GET /api/students', () => {
    it('should return paginated students for admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return paginated students for teacher', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/students')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('should support pagination parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/students?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(10);
    });

    it('should support search query', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/students?q=John')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer()).get('/api/students').expect(401);
    });

    it('should fail for student role', async () => {
      await request(app.getHttpServer())
        .get('/api/students')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });

  describe('GET /api/students/:id', () => {
    it('should return student by ID for admin', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/students/${testStudent.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(testStudent.id);
      expect(response.body.firstName).toBe('John');
      expect(response.body.lastName).toBe('Doe');
    });

    it('should return student by ID for teacher', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/students/${testStudent.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.id).toBe(testStudent.id);
    });

    it('should fail with invalid UUID', async () => {
      await request(app.getHttpServer())
        .get('/api/students/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should fail with non-existent ID', async () => {
      await request(app.getHttpServer())
        .get('/api/students/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer()).get(`/api/students/${testStudent.id}`).expect(401);
    });

    it('should fail for student role', async () => {
      await request(app.getHttpServer())
        .get(`/api/students/${testStudent.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });

  describe('POST /api/students', () => {
    it('should create student for admin', async () => {
      const newStudent = {
        firstName: 'Alice',
        lastName: 'Smith',
        enrollmentStatus: 'active',
      };

      const response = await request(app.getHttpServer())
        .post('/api/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newStudent)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.firstName).toBe('Alice');
      expect(response.body.lastName).toBe('Smith');
    });

    it('should fail with missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Bob',
        })
        .expect(400);
    });

    it('should fail with invalid data types', async () => {
      await request(app.getHttpServer())
        .post('/api/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 123,
          lastName: 'Brown',
          enrollmentStatus: 'active',
        })
        .expect(400);
    });

    it('should fail for teacher role', async () => {
      await request(app.getHttpServer())
        .post('/api/students')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          firstName: 'Charlie',
          lastName: 'Johnson',
          enrollmentStatus: 'active',
        })
        .expect(403);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/students')
        .send({
          firstName: 'Dave',
          lastName: 'Wilson',
        })
        .expect(401);
    });
  });
});
