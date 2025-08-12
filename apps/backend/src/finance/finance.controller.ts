import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '../common/roles.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('fees')
  list(@Query('studentId') studentId: string) {
    return this.financeService.listFees(studentId);
  }

  @Roles(UserRole.ADMIN)
  @Post('fees')
  create(@Body() body: any) {
    return this.financeService.createFee(body);
  }

  @Post('payments')
  pay(@Body() body: { invoiceId: string; amount: number; reference?: string }) {
    return this.financeService.recordPayment(body.invoiceId, body.amount, body.reference);
  }
}
