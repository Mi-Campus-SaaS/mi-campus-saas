import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassSession } from '../classes/entities/class-session.entity';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(ClassSession)
    private readonly sessionsRepo: Repository<ClassSession>,
  ) {}

  forStudent(_studentId: string) {
    // Simplified: return all sessions for now
    return this.sessionsRepo.find();
  }

  forTeacher(_teacherId: string) {
    return this.sessionsRepo.find();
  }
}
