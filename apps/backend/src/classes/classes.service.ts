import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassEntity } from './entities/class.entity';
import { Enrollment } from './entities/enrollment.entity';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(ClassEntity) private readonly classRepo: Repository<ClassEntity>,
    @InjectRepository(Enrollment) private readonly enrRepo: Repository<Enrollment>,
  ) {}

  createClass(data: Partial<ClassEntity>) {
    const c = this.classRepo.create(data);
    return this.classRepo.save(c);
  }

  assignTeacher(classId: string, teacherId: string) {
    return this.classRepo.update({ id: classId }, { teacher: { id: teacherId } as any });
  }
}

