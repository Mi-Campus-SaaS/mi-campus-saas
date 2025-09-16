import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TimestampedEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Enrollment } from '../../classes/entities/enrollment.entity';
import { Grade } from '../../grades/entities/grade.entity';
import { Attendance } from '../../attendance/entities/attendance.entity';
import { GpaSnapshot } from '../../grades/entities/gpa-snapshot.entity';

@Entity()
export class Student extends TimestampedEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ nullable: true })
  enrollmentStatus?: string;

  @Column({ nullable: true })
  schoolLevel?: 'primary' | 'secondary';

  @Column({ nullable: true })
  currentYear?: number; // 1-6 for primary, 1-6/7 for secondary

  @Column({ nullable: true })
  birthDate?: Date;

  @OneToOne(() => User, (user) => user.student, { onDelete: 'SET NULL' })
  @JoinColumn()
  user?: User | null;

  @OneToMany(() => Enrollment, (enr) => enr.student)
  enrollments!: Enrollment[];

  @OneToMany(() => Grade, (g) => g.student)
  grades!: Grade[];

  @OneToMany(() => Attendance, (a) => a.student)
  attendanceRecords!: Attendance[];

  @OneToMany(() => GpaSnapshot, (s) => s.student)
  gpaSnapshots!: GpaSnapshot[];
}
