import { fromCents } from '@/domain/money/money'
import type { Contact } from '@/domain/contact/types'
import type { Movement } from '@/domain/movement/types'
import type { User } from '@/domain/session/types'

export const SEED_USER: User = { id: 'u1', name: 'Carlos Valenzuela' }
export const SEED_BALANCE = fromCents(125_000)
export const SEED_CONTACTS: Contact[] = [
  { id: 'c1', name: 'Ana Díaz', handle: 'ana@spin.mx' },
  { id: 'c2', name: 'Luis Pérez', handle: '55 1234 5678' },
]
export const SEED_MOVEMENTS: Movement[] = [
  { id: 'm1', description: 'Depósito', amountCents: fromCents(50_000), direction: 'in', createdAt: '2026-08-30T10:00:00Z' },
  { id: 'm2', description: 'Café', amountCents: fromCents(4_500), direction: 'out', createdAt: '2026-08-29T09:00:00Z' },
]
