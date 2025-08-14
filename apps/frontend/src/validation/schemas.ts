import { z } from 'zod'

// Common validators
const uuid = z.string().uuid({ message: 'validation.uuid' })
const isoDate = z
  .string()
  .refine((v) => {
    if (!v) return false
    const t = Date.parse(v)
    return Number.isFinite(t)
  }, { message: 'validation.date' })

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, { message: 'validation.username_required' })
    .max(100, { message: 'validation.username_max' }),
  password: z
    .string()
    .min(1, { message: 'validation.password_required' })
    .max(200, { message: 'validation.password_max' }),
})

export const createAnnouncementSchema = z.object({
  content: z
    .string()
    .min(1, { message: 'validation.content_required' })
    .max(1000, { message: 'validation.content_max' }),
  publishAt: z
    .string()
    .optional()
    .refine((v) => !v || Number.isFinite(Date.parse(v)), { message: 'validation.date' }),
})

export const createFeeSchema = z.object({
  studentId: uuid,
  amount: z.coerce.number().refine((n) => Number.isFinite(n), { message: 'validation.number' }).positive({ message: 'validation.positive' }),
  dueDate: isoDate,
  status: z.enum(['pending', 'paid', 'overdue']),
})

export const recordPaymentSchema = z.object({
  invoiceId: uuid,
  amount: z.coerce.number().refine((n) => Number.isFinite(n), { message: 'validation.number' }).positive({ message: 'validation.positive' }),
  reference: z.string().optional(),
})

export const uploadMaterialSchema = z.object({
  title: z
    .string()
    .min(1, { message: 'validation.title_required' })
    .max(200, { message: 'validation.title_max' }),
  description: z.string().max(1000, { message: 'validation.description_max' }).optional(),
  file: z.custom<File>((f) => f instanceof File, { message: 'validation.file_required' }),
})

export type LoginInput = z.infer<typeof loginSchema>
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>
export type CreateFeeInput = z.infer<typeof createFeeSchema>
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>
export type UploadMaterialInput = z.infer<typeof uploadMaterialSchema>

// helper intentionally omitted for now; per-form inline mapping is implemented where needed


