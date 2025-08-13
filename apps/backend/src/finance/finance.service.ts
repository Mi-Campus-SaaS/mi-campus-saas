import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeeInvoice } from './entities/fee.entity';
import { Payment } from './entities/payment.entity';
import { Student } from '../students/entities/student.entity';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(FeeInvoice) private readonly feeRepo: Repository<FeeInvoice>,
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
  ) {}

  listFees(studentId: string) {
    return this.feeRepo.find({ where: { student: { id: studentId } as unknown as Student } });
  }

  createFee(data: Partial<FeeInvoice>) {
    const f = this.feeRepo.create(data);
    return this.feeRepo.save(f);
  }

  recordPayment(invoiceId: string, amount: number, reference?: string) {
    const p = this.paymentRepo.create({ invoice: { id: invoiceId } as unknown as FeeInvoice, amount, reference });
    return this.paymentRepo.save(p).then(async (res) => {
      await this.feeRepo.update({ id: invoiceId }, { status: 'paid' });
      return res;
    });
  }

  async listPaymentsForStudent(studentId: string) {
    const invoices = await this.feeRepo.find({ where: { student: { id: studentId } as unknown as Student } });
    const ids = invoices.map((i) => i.id);
    if (ids.length === 0) return [] as Payment[];
    return this.paymentRepo.find({ where: { invoice: { id: ids as unknown as string } as unknown as FeeInvoice } });
  }
}
