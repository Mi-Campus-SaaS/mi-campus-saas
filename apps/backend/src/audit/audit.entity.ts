import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('audit_events')
@Index(['createdAt'])
@Index(['type'])
@Index(['actorUserId'])
@Index(['targetUserId'])
export class AuditEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'varchar', length: 100 })
  type!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  requestId!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  actorUserId!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  targetUserId!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  objectId!: string | null;

  @Column({ type: 'simple-json', nullable: true })
  meta!: Record<string, unknown> | null;
}
