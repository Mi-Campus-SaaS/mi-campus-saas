import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { ClassEntity } from '../../classes/entities/class.entity';

@Entity()
export class Grade {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Student, (s) => s.grades)
  student!: Student;

  @ManyToOne(() => ClassEntity)
  classEntity!: ClassEntity;

  @Column()
  assignmentName!: string;

  @Column('float')
  score!: number;

  @Column('float')
  maxScore!: number;

  @Column({ type: 'date' })
  date!: string;
}
