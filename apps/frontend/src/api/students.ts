import { api } from './client';
import type { Paginated, Student } from '../types/api';

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
