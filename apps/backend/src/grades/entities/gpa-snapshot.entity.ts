import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Student } from '../../students/entities/student.entity';

@Entity()
export class GpaSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Student, (s) => s.gpaSnapshots, { onDelete: 'CASCADE' })
  student!: Student;

  @Column('float')
  gpa!: number;

  @Column()
  computedAt!: Date;
}
