import { describe, it, expect } from 'vitest'
import { isEmailOrPhone, isValidPassword } from './identifier'

describe('isEmailOrPhone', () => {
  it('accepts an email', () => { expect(isEmailOrPhone('a@b.com')).toBe(true) })
  it('accepts a phone', () => { expect(isEmailOrPhone('+52 55 1234 5678')).toBe(true) })
  it('trims surrounding whitespace', () => { expect(isEmailOrPhone('  a@b.com  ')).toBe(true) })
  it('rejects gibberish', () => { expect(isEmailOrPhone('xx')).toBe(false) })
  it('rejects empty', () => { expect(isEmailOrPhone('')).toBe(false) })
})

describe('isValidPassword', () => {
  it('accepts 6+ chars', () => { expect(isValidPassword('secret')).toBe(true) })
  it('rejects fewer than 6', () => { expect(isValidPassword('12345')).toBe(false) })
  it('rejects empty', () => { expect(isValidPassword('')).toBe(false) })
})
