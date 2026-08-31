import { z } from 'zod'
import { isEmailOrPhone, MIN_PASSWORD_LENGTH } from './identifier'

export const loginSchema = z.object({
  identifier: z.string().trim().refine(isEmailOrPhone, {
    message: 'Ingresa un email o teléfono válido',
  }),
  password: z.string().min(MIN_PASSWORD_LENGTH, {
    message: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
  }),
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
