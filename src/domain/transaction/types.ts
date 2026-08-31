import type { Cents } from '@/domain/money/money'
import type { Contact } from '@/domain/contact/types'

export interface TransactionInput { amountCents: Cents; recipient: Contact }

export type ValidationError =
  | { code: 'amount_required' }
  | { code: 'amount_not_positive' }
  | { code: 'insufficient_balance' }
  | { code: 'recipient_required' }

export type ValidationResult =
  | { ok: true; input: TransactionInput }
  | { ok: false; errors: ValidationError[] }

export interface Receipt { id: string; amountCents: Cents; recipient: Contact; createdAt: string }

export type TransactionResult =
  | { status: 'success'; receipt: Receipt }
  | { status: 'network_error' }
  | { status: 'insufficient_funds' }
  | { status: 'timeout' }
  | { status: 'unknown_error' }
