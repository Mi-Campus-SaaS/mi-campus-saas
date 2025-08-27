import { api } from './client';
import type { Paginated, Student } from '../types/api';

export interface StudentDetail extends Student {
  currentGpa: number;
  gpaTrend: Array<{
    date: string;
    gpa: number;
  }>;
  enrollmentStatus?: string;
  createdAt: string;
  updatedAt: string | null;
}

export async function listStudents(params: {
  page?: number;
  limit?: number;
  q?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}): Promise<Paginated<Student>> {
  const res = await api.get<Paginated<Student>>('/students', { params });
  return res.data;
}

export async function getStudent(id: string): Promise<StudentDetail> {
  const res = await api.get<StudentDetail>(`/students/${id}`);
  return res.data;
}
