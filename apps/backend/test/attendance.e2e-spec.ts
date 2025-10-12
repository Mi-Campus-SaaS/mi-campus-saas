import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { UserRole } from '../src/common/roles.enum';
import { Student } from '../src/students/entities/student.entity';
import { Teacher } from '../src/teachers/entities/teacher.entity';
import { ClassEntity } from '../src/classes/entities/class.entity';
import { ClassSession } from '../src/classes/entities/class-session.entity';
import * as bcrypt from 'bcrypt';
import { getDataSourceToken } from '@nestjs/typeorm';
import { resetDatabase } from './test-helpers';

describe('AttendanceController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;
  let testStudent: Student;
  let testTeacher: Teacher;
  let testClass: ClassEntity;
  let testSession: ClassSession;

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

    const studentUser = await dataSource.getRepository(User).save({
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

    testStudent = await dataSource.getRepository(Student).save({
      firstName: 'John',
      lastName: 'Doe',
      birthDate: new Date('2010-01-01'),
      enrollmentStatus: 'active',
      user: studentUser,
    });

    testClass = await dataSource.getRepository(ClassEntity).save({
      subjectName: 'Mathematics',
      gradeLevel: 'Grade 10',
      teacher: testTeacher,
    });

    testSession = await dataSource.getRepository(ClassSession).save({
      classEntity: testClass,
      dayOfWeek: 1, // Monday
      startTime: '09:00',
      endTime: '10:30',
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

  describe('POST /api/classes/:id/attendance', () => {
    it('should submit attendance for teacher-owned class', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/classes/${testClass.id}/attendance`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          records: [
            {
              studentId: testStudent.id,
              present: true,
              date: '2024-10-12',
              sessionId: testSession.id,
            },
          ],
        })
        .expect(201);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should fail with invalid status', async () => {
      await request(app.getHttpServer())
        .post(`/api/classes/${testClass.id}/attendance`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          records: [
            {
              studentId: testStudent.id,
              status: 'INVALID_STATUS',
              sessionId: testSession.id,
            },
          ],
        })
        .expect(400);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .post(`/api/classes/${testClass.id}/attendance`)
        .send({ records: [] })
        .expect(401);
    });

    it('should fail for non-teacher role', async () => {
      await request(app.getHttpServer())
        .post(`/api/classes/${testClass.id}/attendance`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ records: [] })
        .expect(403);
    });
  });

  describe('POST /api/classes/:classId/sessions/:sessionId/attendance', () => {
    it('should submit session attendance for teacher', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/classes/${testClass.id}/sessions/${testSession.id}/attendance`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          records: [
            {
              studentId: testStudent.id,
              present: true,
              date: '2024-10-12',
            },
          ],
        })
        .expect(201);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should fail with invalid UUID', async () => {
      await request(app.getHttpServer())
        .post(`/api/classes/${testClass.id}/sessions/invalid-id/attendance`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ records: [] })
        .expect(400);
    });
  });

  describe('GET /api/students/:id/attendance', () => {
    it('should get attendance for student owner', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/students/${testStudent.id}/attendance`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should fail for teacher without ownership', async () => {
      await request(app.getHttpServer())
        .get(`/api/students/${testStudent.id}/attendance`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/students/${testStudent.id}/attendance?page=1&limit=10`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(10);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer()).get(`/api/students/${testStudent.id}/attendance`).expect(401);
    });
  });

  describe('GET /api/classes/:classId/sessions/:sessionId/attendance', () => {
    it('should list session attendance for teacher', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/classes/${testClass.id}/sessions/${testSession.id}/attendance`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should list session attendance for admin', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/classes/${testClass.id}/sessions/${testSession.id}/attendance`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('should fail for student role', async () => {
      await request(app.getHttpServer())
        .get(`/api/classes/${testClass.id}/sessions/${testSession.id}/attendance`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });
});
