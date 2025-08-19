import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TimestampedEntity } from '../../common/entities/base.entity';
import { ClassEntity } from './class.entity';

@Entity()
export class ClassSession extends TimestampedEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => ClassEntity, (c) => c.sessions)
  classEntity!: ClassEntity;

  @Column()
  dayOfWeek!: number; // 0-6

  @Column()
  startTime!: string; // HH:mm

  @Column()
  endTime!: string; // HH:mm
}
