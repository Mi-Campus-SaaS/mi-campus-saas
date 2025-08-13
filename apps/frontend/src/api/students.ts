import { api } from './client'
import type { Student } from '../types/api'

export async function listStudents(): Promise<Student[]> {
  const res = await api.get<Student[]>('/students')
  return res.data
}


