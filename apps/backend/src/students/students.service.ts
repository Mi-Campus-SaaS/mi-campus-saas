import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { PaginationQueryDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { StudentWithGpa } from './dto/student-with-gpa.dto';
import { HttpCacheService } from '../common/http-cache.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { calculateGpaFromGrades } from '../utils/gpa.util';

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
      .addSelect('ROUND(CAST(AVG(grade.score * 1.0 / grade.maxScore) * 4 AS numeric), 2)', 'gpa')
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

  async findOne(id: string) {
    const student = await this.studentsRepo.findOne({
      where: { id },
      relations: ['user', 'gpaSnapshots'],
      order: { gpaSnapshots: { computedAt: 'ASC' } },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    // Calculate current GPA from grades
    const grades = await this.studentsRepo
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.grades', 'grade')
      .where('student.id = :id', { id })
      .getOne();

    const currentGpa = grades?.grades?.length
      ? calculateGpaFromGrades(grades.grades.map((g) => ({ score: g.score, maxScore: g.maxScore })))
      : 0;

    // Prepare GPA trend data
    const gpaTrend =
      student.gpaSnapshots?.map((snapshot) => ({
        date: snapshot.computedAt,
        gpa: snapshot.gpa,
      })) || [];

    // Add current GPA if different from last snapshot
    if (gpaTrend.length === 0 || gpaTrend[gpaTrend.length - 1].gpa !== currentGpa) {
      gpaTrend.push({
        date: new Date(),
        gpa: currentGpa,
      });
    }

    return {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      enrollmentStatus: student.enrollmentStatus,
      currentGpa,
      gpaTrend,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    };
  }

  create(body: CreateStudentDto) {
    const s = this.studentsRepo.create(body);
    return this.studentsRepo.save(s).then((saved) => {
      this.httpCache.invalidateByPrefix('http-cache:students');
      return saved;
    });
  }
}
