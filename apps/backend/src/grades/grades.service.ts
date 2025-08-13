import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grade } from './entities/grade.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { Student } from '../students/entities/student.entity';
import { GpaSnapshot } from './entities/gpa-snapshot.entity';
import { calculateGpaFromGrades } from '../utils/gpa.util';

@Injectable()
export class GradesService {
  constructor(
    @InjectRepository(Grade)
    private readonly gradesRepo: Repository<Grade>,
    @InjectRepository(GpaSnapshot)
    private readonly snapshotsRepo: Repository<GpaSnapshot>,
  ) {}

  addForClass(
    classId: string,
    payload: Array<{ studentId: string; assignmentName: string; score: number; maxScore: number; date: string }>,
  ) {
    const grades = payload.map((g) =>
      this.gradesRepo.create({
        classEntity: { id: classId } as unknown as ClassEntity,
        student: { id: g.studentId } as unknown as Student,
        assignmentName: g.assignmentName,
        score: g.score,
        maxScore: g.maxScore,
        date: g.date,
      }),
    );
    return this.gradesRepo.save(grades);
  }

  async calculateStudentGpa(studentId: string) {
    const list = await this.gradesRepo.find({ where: { student: { id: studentId } as unknown as Student } });
    return calculateGpaFromGrades(list.map((g) => ({ score: g.score, maxScore: g.maxScore })));
  }

  async snapshotStudentGpa(studentId: string) {
    const gpa = await this.calculateStudentGpa(studentId);
    const snapshot = this.snapshotsRepo.create({
      student: { id: studentId } as unknown as Student,
      gpa,
      computedAt: new Date(),
    });
    return this.snapshotsRepo.save(snapshot);
  }

  listStudentSnapshots(studentId: string) {
    return this.snapshotsRepo.find({
      where: { student: { id: studentId } as unknown as Student },
      order: { computedAt: 'DESC' },
    });
  }
}
