import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ClassEntity } from '../../classes/entities/class.entity';

@Entity()
export class Teacher {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @OneToOne(() => User, (user) => user.teacher, { onDelete: 'SET NULL' })
  @JoinColumn()
  user?: User | null;

  @OneToMany(() => ClassEntity, (c) => c.teacher)
  classes!: ClassEntity[];
}

