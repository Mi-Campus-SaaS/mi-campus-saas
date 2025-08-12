import { IsDateString, IsEnum, IsNumber, IsPositive, IsUUID } from 'class-validator';

export class CreateFeeDto {
  @IsUUID()
  studentId!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsDateString()
  dueDate!: string;

  @IsEnum(['pending', 'paid', 'overdue'])
  // keep as union literal in entity but validate as enum options
  status!: 'pending' | 'paid' | 'overdue';
}
