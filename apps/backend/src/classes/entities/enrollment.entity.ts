import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { TimestampedEntity } from '../../common/entities/base.entity';
import { Student } from '../../students/entities/student.entity';
import { ClassEntity } from './class.entity';

@Entity()
@Unique('UQ_enrollment_student_class', ['student', 'classEntity'])
export class Enrollment extends TimestampedEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Student, (s) => s.enrollments)
  student!: Student;

  @ManyToOne(() => ClassEntity, (c) => c.enrollments)
  classEntity!: ClassEntity;

  @Column({ default: true })
  active!: boolean;
}
