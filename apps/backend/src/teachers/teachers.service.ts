import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
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
    const where: FindOptionsWhere<Teacher> | FindOptionsWhere<Teacher>[] | undefined = query?.q
      ? [{ firstName: Like(`%${query.q}%`) }, { lastName: Like(`%${query.q}%`) }]
      : undefined;
    const orderDir: 'ASC' | 'DESC' = (query?.sortDir ?? 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const [rows, total] = await this.teachersRepo.findAndCount({
      where,
      order: { lastName: orderDir },
      take: limit,
      skip: (page - 1) * limit,
    });
    return { data: rows, total, page, limit };
  }
}
