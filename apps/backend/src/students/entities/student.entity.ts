import { Column, Entity, JoinColumn, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Enrollment } from '../../classes/entities/enrollment.entity';
import { Grade } from '../../grades/entities/grade.entity';
import { Attendance } from '../../attendance/entities/attendance.entity';

@Entity()
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ nullable: true })
  enrollmentStatus?: string;

  @OneToOne(() => User, (user) => user.student, { onDelete: 'SET NULL' })
  @JoinColumn()
  user?: User | null;

  @OneToMany(() => Enrollment, (enr) => enr.student)
  enrollments!: Enrollment[];

  @OneToMany(() => Grade, (g) => g.student)
  grades!: Grade[];

  @OneToMany(() => Attendance, (a) => a.student)
  attendanceRecords!: Attendance[];
}
