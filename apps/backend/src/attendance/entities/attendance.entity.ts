import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { ClassEntity } from '../../classes/entities/class.entity';
import { ClassSession } from '../../classes/entities/class-session.entity';

@Entity()
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Student, (s) => s.attendanceRecords)
  student!: Student;

  @ManyToOne(() => ClassEntity)
  classEntity!: ClassEntity;

  @ManyToOne(() => ClassSession, { nullable: true })
  session?: ClassSession | null;

  @Index('IDX_attendance_date')
  @Column({ type: 'date' })
  date!: string;

  @Column({ default: true })
  present!: boolean;
}
