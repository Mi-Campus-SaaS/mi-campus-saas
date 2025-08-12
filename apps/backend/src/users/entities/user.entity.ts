import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from '../../common/roles.enum';
import { Student } from '../../students/entities/student.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  username!: string;

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
