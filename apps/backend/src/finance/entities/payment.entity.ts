import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
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

  @Column({ nullable: true })
  reference?: string;
}
