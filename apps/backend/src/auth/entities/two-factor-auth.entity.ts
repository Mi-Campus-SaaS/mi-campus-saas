import { Column, Entity, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { TimestampedEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class TwoFactorAuth extends TimestampedEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user!: User;

  @Column()
  userId!: string;

  @Column({ nullable: true })
  totpSecret?: string;

  @Column({ default: false })
  isEnabled!: boolean;

  @Column({ type: 'simple-array', nullable: true })
  backupCodes?: string[];

  @Column({ default: false })
  isEnrolled!: boolean;
}
