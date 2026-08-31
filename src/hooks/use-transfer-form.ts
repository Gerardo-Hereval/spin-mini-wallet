'use client'
import { toCents, type Cents } from '@/domain/money/money'
import { validateTransaction } from '@/domain/transaction/rules'
import type { Contact } from '@/domain/contact/types'
import type { ValidationError } from '@/domain/transaction/types'

export function useTransferForm(input: {
  amountRaw: string
  recipient: Contact | null
  balanceCents: Cents
}): { amountCents: Cents | null; errors: ValidationError[]; isValid: boolean } {
  const amountCents = input.amountRaw.trim() === '' ? null : toCents(input.amountRaw)
  const result = validateTransaction(
    { amountCents, recipient: input.recipient },
    { balanceCents: input.balanceCents },
  )
  return {
    amountCents,
    errors: result.ok ? [] : result.errors,
    isValid: result.ok,
  }
}
