import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TimestampedEntity } from '../../common/entities/base.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';
import { Enrollment } from './enrollment.entity';
import { ClassSession } from './class-session.entity';

@Entity()
export class ClassEntity extends TimestampedEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  subjectName!: string;

  @Column()
  gradeLevel!: string; // e.g., "1", "2", "3", ...

  @ManyToOne(() => Teacher, (t) => t.classes, { nullable: true })
  teacher?: Teacher | null;

  @OneToMany(() => Enrollment, (e) => e.classEntity)
  enrollments!: Enrollment[];

  @OneToMany(() => ClassSession, (s) => s.classEntity)
  sessions!: ClassSession[];
}
