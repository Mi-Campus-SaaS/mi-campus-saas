import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { ClassEntity } from '../../classes/entities/class.entity';

@Entity()
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Student, (s) => s.attendanceRecords)
  student!: Student;

  @ManyToOne(() => ClassEntity)
  classEntity!: ClassEntity;

  @Column({ type: 'date' })
  date!: string;

  @Column({ default: true })
  present!: boolean;
}

