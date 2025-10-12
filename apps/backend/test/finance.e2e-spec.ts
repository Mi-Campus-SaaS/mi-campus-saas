import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { UserRole } from '../src/common/roles.enum';
import { Student } from '../src/students/entities/student.entity';
import { FeeInvoice } from '../src/finance/entities/fee.entity';
import * as bcrypt from 'bcrypt';
import { getDataSourceToken } from '@nestjs/typeorm';
import { resetDatabase } from './test-helpers';

describe('FinanceController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let adminToken: string;
  let testStudent: Student;
  let testInvoice: FeeInvoice;

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

    const invoiceToSave = {
      student: testStudent,
      amount: 1000,
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      status: 'pending' as const,
    };
    testInvoice = await dataSource.getRepository(FeeInvoice).save(invoiceToSave);

    const adminLoginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'Test123!@#' });
    adminToken = adminLoginResponse.body.access_token;
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('GET /api/fees', () => {
    it('should list fees for admin', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/fees?studentId=${testStudent.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer()).get(`/api/fees?studentId=${testStudent.id}`).expect(401);
    });
  });

  describe('POST /api/fees', () => {
    it('should create fee for admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/fees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          studentId: testStudent.id,
          amount: 500,
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          status: 'pending',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.amount).toBe(500);
    });

    it('should fail with missing fields', async () => {
      await request(app.getHttpServer())
        .post('/api/fees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          studentId: testStudent.id,
        })
        .expect(400);
    });
  });

  describe('POST /api/payments', () => {
    it('should record payment with idempotency key', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', `test-key-${Date.now()}`)
        .send({
          invoiceId: testInvoice.id,
          amount: 500,
          reference: 'TEST-REF-001',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.amount).toBe(500);
    });

    it('should fail without idempotency key', async () => {
      await request(app.getHttpServer())
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId: testInvoice.id,
          amount: 500,
          reference: 'TEST-REF-002',
        })
        .expect(400);
    });

    it('should return same response for duplicate payment with same idempotency key', async () => {
      const idempotencyKey = `duplicate-key-${Date.now()}`;

      const firstResponse = await request(app.getHttpServer())
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          invoiceId: testInvoice.id,
          amount: 100,
          reference: 'TEST-REF-003',
        })
        .expect(201);

      const secondResponse = await request(app.getHttpServer())
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          invoiceId: testInvoice.id,
          amount: 100,
          reference: 'TEST-REF-004',
        })
        .expect(201);

      // Idempotency should return the same payment ID
      expect(secondResponse.body.id).toBe(firstResponse.body.id);
    });
  });

  describe('GET /api/payments', () => {
    it('should list payments for admin', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/payments?studentId=${testStudent.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
