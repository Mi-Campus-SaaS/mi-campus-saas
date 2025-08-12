import { IsNumber, IsOptional, IsPositive, IsUUID } from 'class-validator';

export class RecordPaymentDto {
  @IsUUID()
  invoiceId!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsOptional()
  reference?: string;
}
