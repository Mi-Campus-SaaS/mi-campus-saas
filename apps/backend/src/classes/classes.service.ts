import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassEntity } from './entities/class.entity';
import { Enrollment } from './entities/enrollment.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { InMemoryCacheService } from '../common/cache.service';
import { PaginationQueryDto, PaginatedResponse } from '../common/dto/pagination.dto';

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

  async findAll(query?: PaginationQueryDto & { grade?: string }): Promise<PaginatedResponse<ClassEntity>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const qb = this.classRepo.createQueryBuilder('c').leftJoinAndSelect('c.teacher', 't');
    if (query?.grade) {
      qb.where('c.gradeLevel = :grade', { grade: query.grade });
    }
    const [data, total] = await qb
      .orderBy('c.subjectName', 'ASC')
      .take(limit)
      .skip((page - 1) * limit)
      .getManyAndCount();
    return { data, total, page, limit };
  }
}
