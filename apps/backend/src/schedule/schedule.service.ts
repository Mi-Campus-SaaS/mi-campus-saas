import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassSession } from '../classes/entities/class-session.entity';
import { InMemoryCacheService } from '../common/cache.service';

export interface ScheduleItem {
  id: string;
  time: string;
  subject: string;
  teacher: string;
  room: string;
  day: string;
  duration: number;
}

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(ClassSession)
    private readonly sessionsRepo: Repository<ClassSession>,
    private readonly cache: InMemoryCacheService,
  ) {}

  getDemoSchedule(): ScheduleItem[] {
    return [
      {
        id: '1',
        time: '08:00',
        subject: 'Mathematics',
        teacher: 'Dr. Smith',
        room: 'Room 101',
        day: 'Monday',
        duration: 60,
      },
      {
        id: '2',
        time: '09:15',
        subject: 'English Literature',
        teacher: 'Ms. Johnson',
        room: 'Room 205',
        day: 'Monday',
        duration: 60,
      },
      {
        id: '3',
        time: '10:30',
        subject: 'Physics',
        teacher: 'Prof. Brown',
        room: 'Lab 301',
        day: 'Monday',
        duration: 90,
      },
      {
        id: '4',
        time: '12:00',
        subject: 'History',
        teacher: 'Dr. Davis',
        room: 'Room 102',
        day: 'Monday',
        duration: 60,
      },
      {
        id: '5',
        time: '13:15',
        subject: 'Computer Science',
        teacher: 'Mr. Wilson',
        room: 'Computer Lab',
        day: 'Monday',
        duration: 90,
      },
      {
        id: '6',
        time: '14:45',
        subject: 'Art',
        teacher: 'Ms. Garcia',
        room: 'Art Studio',
        day: 'Monday',
        duration: 60,
      },
    ];
  }

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
