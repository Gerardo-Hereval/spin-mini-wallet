import { describe, it, expect } from 'vitest'
import { isEmailOrPhone, isValidPhone, isValidPassword } from './identifier'

describe('isValidPhone', () => {
  it('accepts a 10-digit number', () => { expect(isValidPhone('5512345678')).toBe(true) })
  it('accepts a 10-digit number with separators', () => { expect(isValidPhone('55 1234 5678')).toBe(true) })
  it('rejects more than 10 digits', () => { expect(isValidPhone('67182829209291091010219')).toBe(false) })
  it('rejects 11 digits', () => { expect(isValidPhone('5512345678 9')).toBe(false) })
  it('rejects too few digits', () => { expect(isValidPhone('12345')).toBe(false) })
  it('rejects letters', () => { expect(isValidPhone('55abc12345')).toBe(false) })
})

describe('isEmailOrPhone', () => {
  it('accepts an email', () => { expect(isEmailOrPhone('a@b.com')).toBe(true) })
  it('accepts a 10-digit phone', () => { expect(isEmailOrPhone('55 1234 5678')).toBe(true) })
  it('trims surrounding whitespace', () => { expect(isEmailOrPhone('  a@b.com  ')).toBe(true) })
  it('rejects a phone longer than 10 digits', () => { expect(isEmailOrPhone('67182829209291091010219')).toBe(false) })
  it('rejects gibberish', () => { expect(isEmailOrPhone('xx')).toBe(false) })
  it('rejects empty', () => { expect(isEmailOrPhone('')).toBe(false) })
})

describe('isValidPassword', () => {
  it('accepts 6+ chars', () => { expect(isValidPassword('secret')).toBe(true) })
  it('rejects fewer than 6', () => { expect(isValidPassword('12345')).toBe(false) })
  it('rejects empty', () => { expect(isValidPassword('')).toBe(false) })
})
