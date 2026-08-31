import { z } from 'zod'

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRe = /^\+?[\d\s()-]{7,}$/

export const loginSchema = z.object({
  identifier: z.string().trim().refine(
    (v) => emailRe.test(v) || phoneRe.test(v),
    { message: 'Ingresa un email o teléfono válido' },
  ),
})

export const contactSchema = z.object({
  name: z.string().trim().min(1),
  handle: z.string().trim().min(1),
})

export const transactionSchema = z.object({
  amountCents: z.number().int(),
  recipientId: z.string().optional(),
  newContact: contactSchema.optional(),
})
