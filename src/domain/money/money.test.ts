import { describe, it, expect } from 'vitest'
import { toCents, fromCents, formatMoney } from './money'

describe('toCents', () => {
  it('parses whole numbers', () => { expect(toCents('12')).toBe(1200) })
  it('parses decimals', () => { expect(toCents('12.34')).toBe(1234) })
  it('rounds to 2 decimals', () => { expect(toCents('12.345')).toBe(1235) })
  it('rejects non-numeric', () => { expect(toCents('abc')).toBeNull() })
  it('rejects empty', () => { expect(toCents('')).toBeNull() })
  it('accepts zero', () => { expect(toCents('0')).toBe(0) })
})

describe('formatMoney', () => {
  it('formats cents to currency', () => { expect(formatMoney(fromCents(1234))).toBe('$12.34') })
  it('formats zero', () => { expect(formatMoney(fromCents(0))).toBe('$0.00') })
})
