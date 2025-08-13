import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeeInvoice } from './entities/fee.entity';
import { Payment } from './entities/payment.entity';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([FeeInvoice, Payment]), CommonModule],
  providers: [FinanceService],
  controllers: [FinanceController],
})
export class FinanceModule {}
