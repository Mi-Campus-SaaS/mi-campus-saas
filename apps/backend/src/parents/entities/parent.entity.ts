import { Column, Entity, JoinColumn, JoinTable, ManyToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Student } from '../../students/entities/student.entity';

@Entity()
export class Parent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @OneToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn()
  user?: User | null;

  @ManyToMany(() => Student, { cascade: false })
  @JoinTable()
  children!: Student[];
}
