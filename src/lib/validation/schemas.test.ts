import { describe, it, expect } from 'vitest'
import { loginSchema } from './schemas'

const validPassword = 'secret123'

describe('loginSchema', () => {
  it('accepts an email + valid password', () => {
    expect(loginSchema.safeParse({ identifier: 'a@b.com', password: validPassword }).success).toBe(true)
  })
  it('accepts a phone + valid password', () => {
    expect(loginSchema.safeParse({ identifier: '+52 55 1234 5678', password: validPassword }).success).toBe(true)
  })
  it('rejects gibberish identifier', () => {
    expect(loginSchema.safeParse({ identifier: 'xx', password: validPassword }).success).toBe(false)
  })
  it('rejects empty identifier', () => {
    expect(loginSchema.safeParse({ identifier: '', password: validPassword }).success).toBe(false)
  })
  it('rejects a password shorter than 6', () => {
    expect(loginSchema.safeParse({ identifier: 'a@b.com', password: '123' }).success).toBe(false)
  })
  it('rejects a missing password', () => {
    expect(loginSchema.safeParse({ identifier: 'a@b.com' }).success).toBe(false)
  })
})
