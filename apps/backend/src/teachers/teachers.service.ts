import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Teacher } from './entities/teacher.entity';
import { PaginationQueryDto, PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class TeachersService {
  constructor(
    @InjectRepository(Teacher)
    private readonly teachersRepo: Repository<Teacher>,
  ) {}

  async findAll(query?: PaginationQueryDto): Promise<PaginatedResponse<Teacher>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const where = query?.q ? [{ firstName: Like(`%${query.q}%`) }, { lastName: Like(`%${query.q}%`) }] : ({} as any);
    const [rows, total] = await this.teachersRepo.findAndCount({
      where,
      order: { lastName: (query?.sortDir ?? 'desc').toUpperCase() as 'ASC' | 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
    return { data: rows, total, page, limit };
  }
}
