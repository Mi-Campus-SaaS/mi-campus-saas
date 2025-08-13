import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '../common/roles.enum';
import { CreateFeeDto } from './dto/create-fee.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { FeeInvoice } from './entities/fee.entity';
import { Student } from '../students/entities/student.entity';
import { ListFeesQueryDto } from './dto/list-fees.query.dto';
import { OwnershipGuard } from '../common/ownership.guard';
import { Ownership } from '../common/ownership.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
@Controller()
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Roles(UserRole.ADMIN, UserRole.PARENT)
  @Get('fees')
  @Ownership({ type: 'studentQuery', key: 'studentId' })
  list(@Query() query: ListFeesQueryDto) {
    return this.financeService.listFees(query.studentId);
  }

  @Roles(UserRole.ADMIN)
  @Post('fees')
  create(@Body() body: CreateFeeDto) {
    const dto: Partial<FeeInvoice> = {
      student: { id: body.studentId } as unknown as Student,
      amount: body.amount,
      dueDate: body.dueDate,
      status: body.status,
    };
    return this.financeService.createFee(dto);
  }

  @Roles(UserRole.ADMIN, UserRole.PARENT)
  @Post('payments')
  @Ownership({ type: 'invoiceIdBody', key: 'invoiceId' })
  pay(@Body() body: RecordPaymentDto) {
    return this.financeService.recordPayment(body.invoiceId, body.amount, body.reference);
  }

  @Roles(UserRole.ADMIN, UserRole.PARENT)
  @Get('payments')
  @Ownership({ type: 'studentQuery', key: 'studentId' })
  listPayments(@Query('studentId') studentId: string) {
    return this.financeService.listPaymentsForStudent(studentId);
  }
}
