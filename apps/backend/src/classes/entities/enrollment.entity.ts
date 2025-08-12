import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { ClassEntity } from './class.entity';

@Entity()
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Student, (s) => s.enrollments)
  student!: Student;

  @ManyToOne(() => ClassEntity, (c) => c.enrollments)
  classEntity!: ClassEntity;

  @Column({ default: true })
  active!: boolean;
}

