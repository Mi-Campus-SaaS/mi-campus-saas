import { IsUUID } from 'class-validator';

export class ListFeesQueryDto {
  @IsUUID()
  studentId!: string;
}
