import { Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TimestampedEntity } from '../../common/entities/base.entity';
import { Student } from '../../students/entities/student.entity';
import { Payment } from './payment.entity';

@Entity()
export class FeeInvoice extends TimestampedEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Student)
  student!: Student;

  @Column('float')
  amount!: number;

  @Index('IDX_fee_dueDate')
  @Column({ type: 'date' })
  dueDate!: string;

  @Column({ default: 'pending' })
  status!: 'pending' | 'paid' | 'overdue';

  @OneToMany(() => Payment, (p) => p.invoice)
  payments!: Payment[];
}
