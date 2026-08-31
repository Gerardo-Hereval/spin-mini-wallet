import type { Cents } from '@/domain/money/money'
import type { Contact } from '@/domain/contact/types'
import type { ValidationError, ValidationResult } from './types'

export function validateTransaction(
  raw: { amountCents: Cents | null; recipient: Contact | null },
  ctx: { balanceCents: Cents },
): ValidationResult {
  const errors: ValidationError[] = []

  if (raw.amountCents === null) {
    errors.push({ code: 'amount_required' })
  } else if (raw.amountCents <= 0) {
    errors.push({ code: 'amount_not_positive' })
  } else if (raw.amountCents > ctx.balanceCents) {
    errors.push({ code: 'insufficient_balance' })
  }

  if (raw.recipient === null) errors.push({ code: 'recipient_required' })

  if (errors.length > 0) return { ok: false, errors }
  return { ok: true, input: { amountCents: raw.amountCents as Cents, recipient: raw.recipient as Contact } }
}
