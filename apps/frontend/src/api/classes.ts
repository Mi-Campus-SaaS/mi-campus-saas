export type ClassItem = {
  id: string
  subjectName: string
  gradeLevel: string
  teacher?: { id: string; firstName?: string; lastName?: string } | null
}

import { api } from './client'
import type { Paginated } from '../types/api'

export async function listClasses(params: { page?: number; limit?: number; grade?: string }): Promise<Paginated<ClassItem>> {
  const res = await api.get<Paginated<ClassItem>>('/classes', { params })
  return res.data
}
