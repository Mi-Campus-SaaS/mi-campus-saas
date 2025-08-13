import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grade } from './entities/grade.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { Student } from '../students/entities/student.entity';

@Injectable()
export class GradesService {
  constructor(
    @InjectRepository(Grade)
    private readonly gradesRepo: Repository<Grade>,
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
    if (list.length === 0) return 0;
    const average = list.reduce((sum, g) => sum + g.score / g.maxScore, 0) / list.length;
    // Simple scale 0-4
    return Math.round(average * 4 * 100) / 100;
  }
}
