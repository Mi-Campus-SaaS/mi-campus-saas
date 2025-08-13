import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from './entities/announcement.entity';

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

  list() {
    return this.announcementsRepo.find({ where: {}, order: { publishAt: 'DESC' } });
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
