import { Column, DeleteDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ClassEntity } from '../../classes/entities/class.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';

@Entity()
export class Announcement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text')
  content!: string;

  @ManyToOne(() => Teacher, { nullable: true })
  author?: Teacher | null;

  @ManyToOne(() => ClassEntity, { nullable: true })
  classEntity?: ClassEntity | null; // null = whole school

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  // When the announcement becomes visible
  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  publishAt!: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt?: Date | null;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date | null;
}
