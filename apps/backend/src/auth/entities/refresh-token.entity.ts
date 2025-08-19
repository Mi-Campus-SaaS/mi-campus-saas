import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { TimestampedEntity } from '../../common/entities/base.entity';

@Entity()
export class RefreshToken extends TimestampedEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user!: User;

  // SHA-256 hash of the raw refresh token
  @Index({ unique: true })
  @Column({ length: 64 })
  tokenHash!: string;

  @Column({ type: 'date' })
  expiresAt!: Date;

  @Column({ type: 'date', nullable: true })
  revokedAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  revokedReason?: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  replacedByTokenId?: string | null;

  // createdAt inherited from TimestampedEntity
  @Column({ type: 'varchar', length: 45, nullable: true })
  createdByIp?: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  revokedByIp?: string | null;
}
