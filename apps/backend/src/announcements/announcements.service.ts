import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Announcement } from './entities/announcement.entity';
import { PaginationQueryDto, PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement)
    private readonly announcementsRepo: Repository<Announcement>,
  ) {}

  create(data: Partial<Announcement>) {
    const entity = this.announcementsRepo.create(data);
    return this.announcementsRepo.save(entity);
  }

  async findById(id: string): Promise<Announcement> {
    const found = await this.announcementsRepo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Announcement not found');
    return found;
  }

  async list(query: PaginationQueryDto): Promise<PaginatedResponse<Announcement>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = query.q ? { content: Like(`%${query.q}%`) } : {};
    const [rows, total] = await this.announcementsRepo.findAndCount({
      where,
      order: { publishAt: (query.sortDir ?? 'desc').toUpperCase() as 'ASC' | 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
    return { data: rows, total, page, limit };
  }

  async update(id: string, data: Partial<Announcement>) {
    const existing = await this.findById(id);
    Object.assign(existing, data);
    return this.announcementsRepo.save(existing);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findById(id);
    await this.announcementsRepo.softRemove(existing);
  }
}
