import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { FeeInvoice } from './fee.entity';

@Entity()
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => FeeInvoice, (i) => i.payments)
  invoice!: FeeInvoice;

  @Column('float')
  amount!: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  paidAt!: Date;

  @Index('UQ_payment_reference', { unique: true })
  @Column({ nullable: true })
  reference?: string;
}
