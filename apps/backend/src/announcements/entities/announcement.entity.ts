import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TimestampedEntity } from '../../common/entities/base.entity';
import { ClassEntity } from '../../classes/entities/class.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';

@Entity()
export class Announcement extends TimestampedEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text')
  content!: string;

  @ManyToOne(() => Teacher, { nullable: true })
  author?: Teacher | null;

  @ManyToOne(() => ClassEntity, { nullable: true })
  classEntity?: ClassEntity | null; // null = whole school

  // createdAt inherited

  // When the announcement is scheduled to become visible
  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  publishAt!: Date;

  // When the announcement was actually published (null if not yet published)
  @Column('timestamp', { nullable: true })
  publishedAt?: Date | null;

  // updatedAt/deletedAt inherited
}
