import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassEntity } from './entities/class.entity';
import { Enrollment } from './entities/enrollment.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { InMemoryCacheService } from '../common/cache.service';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(ClassEntity) private readonly classRepo: Repository<ClassEntity>,
    @InjectRepository(Enrollment) private readonly enrRepo: Repository<Enrollment>,
    private readonly cache: InMemoryCacheService,
  ) {}

  createClass(data: Partial<ClassEntity>) {
    const c = this.classRepo.create(data);
    return this.classRepo.save(c).then((saved) => {
      this.cache.invalidatePrefix('classes:');
      this.cache.invalidatePrefix('schedule:');
      return saved;
    });
  }

  assignTeacher(classId: string, teacherId: string) {
    return this.classRepo.update({ id: classId }, { teacher: { id: teacherId } as unknown as Teacher }).then((res) => {
      this.cache.invalidatePrefix('classes:');
      this.cache.invalidatePrefix('schedule:');
      return res;
    });
  }
}
