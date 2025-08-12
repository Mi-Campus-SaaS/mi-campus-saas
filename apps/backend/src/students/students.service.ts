import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentsRepo: Repository<Student>,
  ) {}

  findAll() {
    return this.studentsRepo.find();
  }

  create(data: Partial<Student>) {
    const s = this.studentsRepo.create(data);
    return this.studentsRepo.save(s);
  }
}

