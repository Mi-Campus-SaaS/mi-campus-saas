import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassSession } from '../classes/entities/class-session.entity';
import { InMemoryCacheService } from '../common/cache.service';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(ClassSession)
    private readonly sessionsRepo: Repository<ClassSession>,
    private readonly cache: InMemoryCacheService,
  ) {}

  async forStudent(studentId: string) {
    const key = `schedule:student:${studentId}`;
    const cached = this.cache.get<ClassSession[]>(key);
    if (cached) return cached;
    const data = await this.sessionsRepo.find();
    this.cache.set(key, data, 30_000);
    return data;
  }

  async forTeacher(teacherId: string) {
    const key = `schedule:teacher:${teacherId}`;
    const cached = this.cache.get<ClassSession[]>(key);
    if (cached) return cached;
    const data = await this.sessionsRepo.find();
    this.cache.set(key, data, 30_000);
    return data;
  }
}
