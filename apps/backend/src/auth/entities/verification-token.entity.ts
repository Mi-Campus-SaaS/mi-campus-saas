import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TimestampedEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum TokenType {
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
}

@Entity()
@Index(['token', 'type'], { unique: true })
@Index(['userId', 'type'])
export class VerificationToken extends TimestampedEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  token!: string;

  @Column({ type: 'enum', enum: TokenType })
  type!: TokenType;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  usedAt?: Date;

  @Column({ type: 'text', nullable: true })
  usedFromIp?: string;

  @Column({ type: 'text', nullable: true })
  usedFromUserAgent?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
}
