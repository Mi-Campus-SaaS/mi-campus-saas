import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config as dotenvConfig } from 'dotenv';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { ClassSession } from '../classes/entities/class-session.entity';
import { Enrollment } from '../classes/entities/enrollment.entity';
import { Grade } from '../grades/entities/grade.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Material } from '../materials/entities/material.entity';
import { Announcement } from '../announcements/entities/announcement.entity';
import { FeeInvoice } from '../finance/entities/fee.entity';
import { Payment } from '../finance/entities/payment.entity';
import { UserRole } from '../common/roles.enum';

dotenvConfig();

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env.DATABASE_PATH || './data/dev.sqlite',
  entities: [
    User,
    Student,
    Teacher,
    ClassEntity,
    ClassSession,
    Enrollment,
    Grade,
    Attendance,
    Material,
    Announcement,
    FeeInvoice,
    Payment,
  ],
  synchronize: true,
});

async function run() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);
  const studentRepo = AppDataSource.getRepository(Student);
  const teacherRepo = AppDataSource.getRepository(Teacher);
  const classRepo = AppDataSource.getRepository(ClassEntity);
  const sessionRepo = AppDataSource.getRepository(ClassSession);
  const enrollRepo = AppDataSource.getRepository(Enrollment);

  // Idempotent upserts by unique fields
  const existingAdmin = await userRepo.findOne({ where: { username: 'admin' } });
  const admin =
    existingAdmin ??
    userRepo.create({
      username: 'admin',
      displayName: 'Administrador',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: UserRole.ADMIN,
    });
  if (!existingAdmin) await userRepo.save(admin);

  let teacherUser = await userRepo.findOne({ where: { username: 'prof.juana' } });
  if (!teacherUser) {
    teacherUser = userRepo.create({
      username: 'prof.juana',
      displayName: 'Prof. Juana',
      passwordHash: await bcrypt.hash('teacher123', 10),
      role: UserRole.TEACHER,
    });
    await userRepo.save(teacherUser);
  }
  let teacher = await teacherRepo.findOne({ where: { user: { id: teacherUser.id } } });
  if (!teacher) {
    teacher = teacherRepo.create({ firstName: 'Juana', lastName: 'García', user: teacherUser });
    await teacherRepo.save(teacher);
  }

  let studentUser = await userRepo.findOne({ where: { username: 'alumno.pedro' } });
  if (!studentUser) {
    studentUser = userRepo.create({
      username: 'alumno.pedro',
      displayName: 'Pedro',
      passwordHash: await bcrypt.hash('student123', 10),
      role: UserRole.STUDENT,
    });
    await userRepo.save(studentUser);
  }
  let student = await studentRepo.findOne({ where: { user: { id: studentUser.id } } });
  if (!student) {
    student = studentRepo.create({
      firstName: 'Pedro',
      lastName: 'Pérez',
      enrollmentStatus: 'activo',
      user: studentUser,
    });
    await studentRepo.save(student);
  }

  let class1 = await classRepo.findOne({
    where: { subjectName: 'Matemática', gradeLevel: '5', teacher: { id: teacher.id } },
  });
  if (!class1) {
    class1 = classRepo.create({ subjectName: 'Matemática', gradeLevel: '5', teacher });
    await classRepo.save(class1);
  }
  const existingSession = await sessionRepo.findOne({
    where: { classEntity: { id: class1.id }, dayOfWeek: 1, startTime: '09:00', endTime: '10:00' },
  });
  if (!existingSession) {
    const session = sessionRepo.create({ classEntity: class1, dayOfWeek: 1, startTime: '09:00', endTime: '10:00' });
    await sessionRepo.save(session);
  }
  const existingEnrollment = await enrollRepo.findOne({
    where: { student: { id: student.id }, classEntity: { id: class1.id } },
  });
  if (!existingEnrollment) {
    const enr = enrollRepo.create({ student, classEntity: class1, active: true });
    await enrollRepo.save(enr);
  }

  console.log('Seed data created');
  await AppDataSource.destroy();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
