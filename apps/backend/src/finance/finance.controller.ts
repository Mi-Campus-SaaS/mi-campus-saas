import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '../common/roles.enum';
import { CreateFeeDto } from './dto/create-fee.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { FeeInvoice } from './entities/fee.entity';
import { ListFeesQueryDto } from './dto/list-fees.query.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('fees')
  list(@Query() query: ListFeesQueryDto) {
    return this.financeService.listFees(query.studentId);
  }

  @Roles(UserRole.ADMIN)
  @Post('fees')
  create(@Body() body: CreateFeeDto) {
    const dto: Partial<FeeInvoice> = {
      student: { id: body.studentId } as any,
      amount: body.amount,
      dueDate: body.dueDate,
      status: body.status,
    };
    return this.financeService.createFee(dto);
  }

  @Post('payments')
  pay(@Body() body: RecordPaymentDto) {
    return this.financeService.recordPayment(body.invoiceId, body.amount, body.reference);
  }
}
