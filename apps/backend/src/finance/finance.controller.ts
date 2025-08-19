import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  Headers,
  BadRequestException,
} from '@nestjs/common';
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
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { OwnershipGuard } from '../common/ownership.guard';
import { Ownership } from '../common/ownership.decorator';
import { Throttle } from '@nestjs/throttler';
import { CacheInterceptor, HttpCache } from '../common/cache.interceptor';

const FINANCE_LIMIT = Number(process.env.FINANCE_THROTTLE_LIMIT ?? 30);
const FINANCE_TTL = Number(process.env.FINANCE_THROTTLE_TTL_SECONDS ?? 60);

@UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
@Controller()
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Roles(UserRole.ADMIN, UserRole.PARENT)
  @UseInterceptors(CacheInterceptor)
  @HttpCache({ maxAge: 600 }) // Cache for 10 minutes (financial data changes less frequently)
  @Get('fees')
  @Ownership({ type: 'studentQuery', key: 'studentId' })
  @Throttle({
    default: {
      limit: FINANCE_LIMIT,
      ttl: FINANCE_TTL,
    },
  })
  list(@Query() query: ListFeesQueryDto & PaginationQueryDto) {
    return this.financeService.listFees(query.studentId, query);
  }

  @Roles(UserRole.ADMIN)
  @Post('fees')
  @Throttle({
    default: {
      limit: FINANCE_LIMIT,
      ttl: FINANCE_TTL,
    },
  })
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
  @Throttle({
    default: {
      limit: FINANCE_LIMIT,
      ttl: FINANCE_TTL,
    },
  })
  pay(@Body() body: RecordPaymentDto, @Headers() headers: Record<string, string | undefined>) {
    const headerKey = headers['idempotency-key'] || headers['Idempotency-Key'] || headers['x-idempotency-key'];
    if (!headerKey) {
      throw new BadRequestException('Missing Idempotency-Key header');
    }
    return this.financeService.recordPayment(body.invoiceId, body.amount, body.reference, headerKey);
  }

  @Roles(UserRole.ADMIN, UserRole.PARENT)
  @Get('payments')
  @Ownership({ type: 'studentQuery', key: 'studentId' })
  @Throttle({
    default: {
      limit: FINANCE_LIMIT,
      ttl: FINANCE_TTL,
    },
  })
  listPayments(@Query() query: { studentId: string } & PaginationQueryDto) {
    return this.financeService.listPaymentsForStudent(query.studentId, query);
  }
}
