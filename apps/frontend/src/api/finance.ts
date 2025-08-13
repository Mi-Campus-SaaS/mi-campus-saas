import { api } from './client'

export type FeeInvoice = {
  id: string
  amount: number
  dueDate: string | Date
  status: 'paid' | 'unpaid'
}

export type Payment = {
  id: string
  amount: number
  paidAt: string | Date
  reference?: string | null
  invoice: { id: string }
}

export async function listFees(studentId: string): Promise<FeeInvoice[]> {
  const res = await api.get<FeeInvoice[]>(`/fees`, { params: { studentId } })
  return res.data
}

export async function listPayments(studentId: string): Promise<Payment[]> {
  const res = await api.get<Payment[]>(`/payments`, { params: { studentId } })
  return res.data
}

export async function createFee(input: { studentId: string; amount: number; dueDate: string; status: 'paid' | 'unpaid' }): Promise<FeeInvoice> {
  const res = await api.post<FeeInvoice>(`/fees`, input)
  return res.data
}

export async function recordPayment(input: { invoiceId: string; amount: number; reference?: string }): Promise<Payment> {
  const res = await api.post<Payment>(`/payments`, input)
  return res.data
}


