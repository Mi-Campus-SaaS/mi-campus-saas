import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TimestampedEntity } from '../../common/entities/base.entity';
import { FeeInvoice } from './fee.entity';

@Entity()
export class Payment extends TimestampedEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => FeeInvoice, (i) => i.payments)
  invoice!: FeeInvoice;

  @Column('float')
  amount!: number;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  paidAt!: Date;

  @Index('UQ_payment_reference', { unique: true })
  @Column({ nullable: true })
  reference?: string;

  @Index('UQ_payment_idempotency', { unique: true })
  @Column({ nullable: true, length: 128, select: false })
  idempotencyKey!: string;
}
