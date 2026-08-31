import { describe, it, expect } from 'vitest'
import { validateTransaction } from './rules'
import { fromCents } from '@/domain/money/money'

const contact = { id: '1', name: 'Ana', handle: 'ana@x.com' }
const ctx = { balanceCents: fromCents(10000) } // $100

describe('validateTransaction', () => {
  it('accepts a valid transaction', () => {
    const r = validateTransaction({ amountCents: fromCents(5000), recipient: contact }, ctx)
    expect(r.ok).toBe(true)
  })
  it('rejects null amount', () => {
    const r = validateTransaction({ amountCents: null, recipient: contact }, ctx)
    expect(r).toEqual({ ok: false, errors: [{ code: 'amount_required' }] })
  })
  it('rejects zero amount', () => {
    const r = validateTransaction({ amountCents: fromCents(0), recipient: contact }, ctx)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors).toContainEqual({ code: 'amount_not_positive' })
  })
  it('rejects amount over balance', () => {
    const r = validateTransaction({ amountCents: fromCents(20000), recipient: contact }, ctx)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors).toContainEqual({ code: 'insufficient_balance' })
  })
  it('rejects missing recipient', () => {
    const r = validateTransaction({ amountCents: fromCents(5000), recipient: null }, ctx)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors).toContainEqual({ code: 'recipient_required' })
  })
  it('collects multiple errors', () => {
    const r = validateTransaction({ amountCents: null, recipient: null }, ctx)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.length).toBe(2)
  })
})
