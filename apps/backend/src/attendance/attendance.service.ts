import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
  ) {}

  async submitForClass(classId: string, records: Array<{ studentId: string; present: boolean; date: string }>) {
    const entities = records.map((r) =>
      this.attendanceRepo.create({
        classEntity: { id: classId } as any,
        student: { id: r.studentId } as any,
        present: r.present,
        date: r.date,
      }),
    );
    return this.attendanceRepo.save(entities);
  }

  async getForStudent(studentId: string) {
    const list = await this.attendanceRepo.find({ where: { student: { id: studentId } as any } });
    if (!list) throw new NotFoundException();
    return list;
  }
}
