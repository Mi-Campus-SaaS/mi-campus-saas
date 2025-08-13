import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { Student } from '../students/entities/student.entity';
import { ClassSession } from '../classes/entities/class-session.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
  ) {}

  async submitForClass(
    classId: string,
    records: Array<{ studentId: string; present: boolean; date: string; sessionId?: string }>,
  ) {
    const entities = records.map((r) =>
      this.attendanceRepo.create({
        classEntity: { id: classId } as unknown as ClassEntity,
        student: { id: r.studentId } as unknown as Student,
        present: r.present,
        date: r.date,
        session: r.sessionId ? ({ id: r.sessionId } as unknown as ClassSession) : undefined,
      }),
    );
    return this.attendanceRepo.save(entities);
  }

  async getForStudent(studentId: string) {
    const list = await this.attendanceRepo.find({ where: { student: { id: studentId } as unknown as Student } });
    if (!list) throw new NotFoundException();
    return list;
  }

  async listBySession(sessionId: string, limit = 20, offset = 0) {
    const [rows, total] = await this.attendanceRepo.findAndCount({
      where: { session: { id: sessionId } as unknown as ClassSession },
      order: { date: 'DESC' },
      take: limit,
      skip: offset,
      relations: { student: true },
    });
    return {
      data: rows,
      total,
      limit,
      offset,
    };
  }
}
