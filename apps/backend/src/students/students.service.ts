import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { PaginationQueryDto, PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentsRepo: Repository<Student>,
  ) {}

  async findAll(query?: PaginationQueryDto): Promise<PaginatedResponse<Student>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const where = query?.q ? [{ firstName: Like(`%${query.q}%`) }, { lastName: Like(`%${query.q}%`) }] : ({} as any);
    const [rows, total] = await this.studentsRepo.findAndCount({
      where,
      order: { lastName: (query?.sortDir ?? 'desc').toUpperCase() as 'ASC' | 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
    return { data: rows, total, page, limit };
  }

  create(data: Partial<Student>) {
    const s = this.studentsRepo.create(data);
    return this.studentsRepo.save(s);
  }
}
