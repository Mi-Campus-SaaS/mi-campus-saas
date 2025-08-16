import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { PaginationQueryDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { StudentWithGpa } from './dto/student-with-gpa.dto';
import { HttpCacheService } from '../common/http-cache.service';

interface RawStudentData {
  gpa?: string | number;
}

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentsRepo: Repository<Student>,
    private readonly httpCache: HttpCacheService,
  ) {}

  async findAll(query?: PaginationQueryDto): Promise<PaginatedResponse<StudentWithGpa>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const q = query?.q?.trim();
    const sortBy = (query?.sortBy as 'gpa' | 'lastName' | undefined) ?? 'lastName';
    const sortDir = (query?.sortDir ?? 'desc').toUpperCase() as 'ASC' | 'DESC';

    const countQb = this.studentsRepo.createQueryBuilder('student');
    if (q) {
      countQb.where('student.firstName LIKE :q OR student.lastName LIKE :q', { q: `%${q}%` });
    }
    const total = await countQb.getCount();

    const dataQb = this.studentsRepo
      .createQueryBuilder('student')
      .leftJoin('student.grades', 'grade')
      .select(['student.id', 'student.firstName', 'student.lastName'])
      .addSelect('ROUND(AVG(grade.score * 1.0 / grade.maxScore) * 4, 2)', 'gpa')
      .groupBy('student.id');

    if (q) {
      dataQb.where('student.firstName LIKE :q OR student.lastName LIKE :q', { q: `%${q}%` });
    }

    if (sortBy === 'gpa') {
      dataQb.orderBy('gpa', sortDir).addOrderBy('student.lastName', 'ASC');
    } else {
      dataQb.orderBy('student.lastName', sortDir).addOrderBy('student.firstName', sortDir);
    }

    dataQb.take(limit).skip((page - 1) * limit);

    const { raw, entities } = await dataQb.getRawAndEntities();
    const data = entities.map((s, idx) => {
      const rawData = raw[idx] as RawStudentData;
      const gpaRaw = rawData?.gpa;
      const gpa = gpaRaw == null ? undefined : Number(gpaRaw);
      return { ...s, gpa };
    });

    return { data, total, page, limit };
  }

  create(data: Partial<Student>) {
    const s = this.studentsRepo.create(data);
    return this.studentsRepo.save(s).then((saved) => {
      this.httpCache.invalidateByPrefix('http-cache:students');
      return saved;
    });
  }
}
