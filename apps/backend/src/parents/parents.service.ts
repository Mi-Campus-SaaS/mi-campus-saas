import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parent } from './entities/parent.entity';
import { Student } from '../students/entities/student.entity';

@Injectable()
export class ParentsService {
  constructor(
    @InjectRepository(Parent) private readonly parentsRepo: Repository<Parent>,
    @InjectRepository(Student) private readonly studentsRepo: Repository<Student>,
  ) {}

  async listChildren(parentId: string) {
    const parent = await this.parentsRepo.findOne({ where: { id: parentId }, relations: { children: true } });
    if (!parent) throw new NotFoundException('Parent not found');
    return parent.children ?? [];
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
