import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeeInvoice } from './entities/fee.entity';
import { Payment } from './entities/payment.entity';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(FeeInvoice) private readonly feeRepo: Repository<FeeInvoice>,
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
  ) {}

  listFees(studentId: string) {
    return this.feeRepo.find({ where: { student: { id: studentId } as any } });
  }

  createFee(data: Partial<FeeInvoice>) {
    const f = this.feeRepo.create(data);
    return this.feeRepo.save(f);
  }

  recordPayment(invoiceId: string, amount: number, reference?: string) {
    const p = this.paymentRepo.create({ invoice: { id: invoiceId } as any, amount, reference });
    return this.paymentRepo.save(p).then(async (res) => {
      await this.feeRepo.update({ id: invoiceId }, { status: 'paid' });
      return res;
    });
  }
}
