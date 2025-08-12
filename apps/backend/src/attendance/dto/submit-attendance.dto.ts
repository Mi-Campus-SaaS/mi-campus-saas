import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsDateString, IsUUID, ValidateNested } from 'class-validator';

class AttendanceRecordDto {
  @IsUUID()
  studentId!: string;

  @IsBoolean()
  present!: boolean;

  @IsDateString()
  date!: string;
}

export class SubmitAttendanceDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  records!: AttendanceRecordDto[];
}
