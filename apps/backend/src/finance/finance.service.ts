import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeeInvoice } from './entities/fee.entity';
import { Payment } from './entities/payment.entity';
import { Student } from '../students/entities/student.entity';
import { PaginationQueryDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { AuditLogger } from '../common/audit.logger';
import { HttpCacheService } from '../common/http-cache.service';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(FeeInvoice) private readonly feeRepo: Repository<FeeInvoice>,
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    private readonly audit: AuditLogger,
    private readonly httpCache: HttpCacheService,
  ) {}

  async listFees(studentId: string, query?: PaginationQueryDto): Promise<PaginatedResponse<FeeInvoice>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const where = {
      student: { id: studentId } as unknown as Student,
    } as const;
    const [rows, total] = await this.feeRepo.findAndCount({
      where,
      order: { dueDate: (query?.sortDir ?? 'desc').toUpperCase() as 'ASC' | 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
    return { data: rows, total, page, limit };
  }

  createFee(data: Partial<FeeInvoice>) {
    const f = this.feeRepo.create(data);
    return this.feeRepo.save(f).then((saved) => {
      void this.audit.log({
        type: 'finance.create_fee',
        // actorId omitted without request context; could be added via interceptor
        studentId: (saved.student as unknown as Student).id,
        amount: saved.amount,
        dueDate: String(saved.dueDate),
      });
      this.httpCache.invalidateByPrefix('http-cache:fees');
      return saved;
    });
  }

  recordPayment(invoiceId: string, amount: number, reference?: string) {
    const p = this.paymentRepo.create({ invoice: { id: invoiceId } as unknown as FeeInvoice, amount, reference });
    return this.paymentRepo.save(p).then(async (res) => {
      await this.feeRepo.update({ id: invoiceId }, { status: 'paid' });
      void this.audit.log({ type: 'finance.record_payment', invoiceId, amount });
      this.httpCache.invalidateByPrefix('http-cache:fees');
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
