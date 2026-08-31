import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTransferForm } from './use-transfer-form'
import { fromCents } from '@/domain/money/money'

const contact = { id: 'c1', name: 'Ana', handle: 'ana@x.com' }
const balance = fromCents(10000)

describe('useTransferForm', () => {
  it('is invalid with an empty amount', () => {
    const { result } = renderHook(() => useTransferForm({ amountRaw: '', recipient: contact, balanceCents: balance }))
    expect(result.current.isValid).toBe(false)
  })
  it('is invalid over balance', () => {
    const { result } = renderHook(() => useTransferForm({ amountRaw: '200', recipient: contact, balanceCents: balance }))
    expect(result.current.errors).toContainEqual({ code: 'insufficient_balance' })
  })
  it('is valid with amount within balance and a recipient', () => {
    const { result } = renderHook(() => useTransferForm({ amountRaw: '50', recipient: contact, balanceCents: balance }))
    expect(result.current.isValid).toBe(true)
    expect(result.current.amountCents).toBe(5000)
  })
})
