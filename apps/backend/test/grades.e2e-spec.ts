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
import * as bcrypt from 'bcrypt';
import { getDataSourceToken } from '@nestjs/typeorm';
import { resetDatabase } from './test-helpers';

describe('GradesController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;
  let testStudent: Student;
  let testTeacher: Teacher;
  let testClass: ClassEntity;

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

  describe('POST /api/classes/:id/grades', () => {
    it('should add grades for teacher-owned class', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/classes/${testClass.id}/grades`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          grades: [
            {
              studentId: testStudent.id,
              assignmentName: 'Midterm Exam',
              score: 95,
              maxScore: 100,
              date: '2024-10-01',
            },
          ],
        })
        .expect(201);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should fail with invalid grade value', async () => {
      await request(app.getHttpServer())
        .post(`/api/classes/${testClass.id}/grades`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          grades: [
            {
              studentId: testStudent.id,
              assignmentName: 'Test',
              score: -10,
              maxScore: 100,
              date: '2024-10-01',
            },
          ],
        })
        .expect(400);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer()).post(`/api/classes/${testClass.id}/grades`).send({ grades: [] }).expect(401);
    });

    it('should fail for non-teacher role', async () => {
      await request(app.getHttpServer())
        .post(`/api/classes/${testClass.id}/grades`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ grades: [] })
        .expect(403);
    });
  });

  describe('GET /api/students/:id/gpa', () => {
    it('should calculate GPA for student owner', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/students/${testStudent.id}/gpa`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      // Service returns a GPA object with properties
      expect(response.body).toBeDefined();
      expect(typeof response.body).toBe('object');
    });

    it('should fail for teacher without ownership', async () => {
      await request(app.getHttpServer())
        .get(`/api/students/${testStudent.id}/gpa`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);
    });

    it('should fail with invalid UUID', async () => {
      await request(app.getHttpServer())
        .get('/api/students/invalid-id/gpa')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer()).get(`/api/students/${testStudent.id}/gpa`).expect(401);
    });
  });

  describe('POST /api/students/:id/gpa/snapshots', () => {
    it('should fail for teacher without ownership', async () => {
      await request(app.getHttpServer())
        .post(`/api/students/${testStudent.id}/gpa/snapshots`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);
    });

    it('should fail for student role', async () => {
      await request(app.getHttpServer())
        .post(`/api/students/${testStudent.id}/gpa/snapshots`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });

  describe('GET /api/students/:id/gpa/snapshots', () => {
    it('should list GPA snapshots for student owner', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/students/${testStudent.id}/gpa/snapshots`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should fail for teacher without ownership', async () => {
      await request(app.getHttpServer())
        .get(`/api/students/${testStudent.id}/gpa/snapshots`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);
    });
  });
});
