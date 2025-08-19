import { Column, Entity, OneToOne, PrimaryGeneratedColumn, Index } from 'typeorm';
import { TimestampedEntity } from '../../common/entities/base.entity';
import { UserRole } from '../../common/roles.enum';
import { Student } from '../../students/entities/student.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';

@Entity()
export class User extends TimestampedEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  username!: string;

  @Index('UQ_user_email', { unique: true })
  @Column({ nullable: true })
  email?: string;

  @Column()
  displayName!: string;

  @Column()
  passwordHash!: string;

  @Column({ type: 'text' })
  role!: UserRole;

  @OneToOne(() => Student, (student) => student.user, { nullable: true })
  student?: Student | null;

  @OneToOne(() => Teacher, (teacher) => teacher.user, { nullable: true })
  teacher?: Teacher | null;
}
