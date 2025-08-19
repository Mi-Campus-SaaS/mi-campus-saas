import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parent } from './entities/parent.entity';
import { Student } from '../students/entities/student.entity';
import { PaginationQueryDto, PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class ParentsService {
  constructor(
    @InjectRepository(Parent) private readonly parentsRepo: Repository<Parent>,
    @InjectRepository(Student) private readonly studentsRepo: Repository<Student>,
  ) {}

  async listChildren(parentId: string, query?: PaginationQueryDto): Promise<PaginatedResponse<Student>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const parent = await this.parentsRepo.findOne({ where: { id: parentId }, relations: { children: true } });
    if (!parent) throw new NotFoundException('Parent not found');
    const children = parent.children ?? [];
    const total = children.length;
    const start = (page - 1) * limit;
    const data = children.slice(start, start + limit);
    return { data, total, page, limit };
  }

  async linkChild(parentId: string, studentId: string) {
    const parent = await this.parentsRepo.findOne({ where: { id: parentId }, relations: { children: true } });
    if (!parent) throw new NotFoundException('Parent not found');
    const student = await this.studentsRepo.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    const children = parent.children ?? [];
    const alreadyLinked = children.some((c) => c.id === student.id);
    if (!alreadyLinked) {
      children.push(student);
      parent.children = children;
      await this.parentsRepo.save(parent);
    }
    return parent.children;
  }

  async unlinkChild(parentId: string, studentId: string) {
    const parent = await this.parentsRepo.findOne({ where: { id: parentId }, relations: { children: true } });
    if (!parent) throw new NotFoundException('Parent not found');
    const children = parent.children ?? [];
    const nextChildren = children.filter((c) => c.id !== studentId);
    if (nextChildren.length !== children.length) {
      parent.children = nextChildren;
      await this.parentsRepo.save(parent);
    }
    return parent.children;
  }
}
