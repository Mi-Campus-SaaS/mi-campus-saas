import { api } from './client'
import type { Paginated } from '../types/api'

export type FeeInvoice = {
  id: string
  amount: number
  dueDate: string | Date
  status: 'pending' | 'paid' | 'overdue'
}

export type Payment = {
  id: string
  amount: number
  paidAt: string | Date
  reference?: string | null
  invoice: { id: string }
}

export async function listFees(studentId: string): Promise<Paginated<FeeInvoice>> {
  const res = await api.get<Paginated<FeeInvoice>>(`/fees`, { params: { studentId } })
  return res.data
}

export async function listPayments(studentId: string): Promise<Payment[]> {
  const res = await api.get<Payment[]>(`/payments`, { params: { studentId } })
  return res.data
}

export async function createFee(input: { studentId: string; amount: number; dueDate: string; status: 'pending' | 'paid' | 'overdue' }): Promise<FeeInvoice> {
  const res = await api.post<FeeInvoice>(`/fees`, input)
  return res.data
}

export async function recordPayment(input: { invoiceId: string; amount: number; reference?: string }): Promise<Payment> {
  const res = await api.post<Payment>(`/payments`, input)
  return res.data
}


