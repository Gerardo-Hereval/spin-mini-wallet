import { describe, it, expect } from 'vitest'
import { formatReceiptText } from './receipt'
import { fromCents } from '@/domain/money/money'
import type { Receipt } from '@/domain/transaction/types'

const receipt: Receipt = {
  id: 't123',
  amountCents: fromCents(5000),
  recipient: { id: 'c1', name: 'Ana Díaz', handle: 'ana@spin.mx' },
  createdAt: '2026-08-31T15:30:00.000Z',
}

describe('formatReceiptText', () => {
  const text = formatReceiptText(receipt)
  it('includes the formatted amount', () => { expect(text).toContain('$50.00') })
  it('includes the recipient name and handle', () => {
    expect(text).toContain('Ana Díaz')
    expect(text).toContain('ana@spin.mx')
  })
  it('includes the transaction id', () => { expect(text).toContain('t123') })
  it('mentions Spin Wallet', () => { expect(text).toContain('Spin Wallet') })
})
