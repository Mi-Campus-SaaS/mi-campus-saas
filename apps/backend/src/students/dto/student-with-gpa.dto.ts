import { Student } from '../entities/student.entity';

export interface StudentWithGpa extends Student {
  gpa?: number;
}
