import { IsDateString, IsIn, IsNumber, IsPositive, IsUUID } from 'class-validator';

export class CreateFeeDto {
  @IsUUID()
  studentId!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsDateString()
  dueDate!: string;

  @IsIn(['pending', 'paid', 'overdue'])
  status!: 'pending' | 'paid' | 'overdue';
}
