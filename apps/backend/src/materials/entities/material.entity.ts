import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ClassEntity } from '../../classes/entities/class.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';

@Entity()
export class Material {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => ClassEntity)
  classEntity!: ClassEntity;

  @ManyToOne(() => Teacher)
  uploader!: Teacher;

  @Column()
  title!: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  filePath!: string; // local path or S3 key

  @Column({ nullable: true })
  url?: string; // optional external link

  @Column({ nullable: true })
  originalName?: string;

  @Column({ nullable: true })
  mimeType?: string;

  @Column({ type: 'int', nullable: true })
  size?: number;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}
