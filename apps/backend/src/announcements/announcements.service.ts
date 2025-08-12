import { Injectable } from '@nestjs/common';
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

  list() {
    return this.announcementsRepo.find({ order: { createdAt: 'DESC' } });
  }
}

