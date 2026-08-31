import { describe, it, expect } from 'vitest'
import { loginSchema } from './schemas'

describe('loginSchema', () => {
  it('accepts an email', () => { expect(loginSchema.safeParse({ identifier: 'a@b.com' }).success).toBe(true) })
  it('accepts a phone', () => { expect(loginSchema.safeParse({ identifier: '+52 55 1234 5678' }).success).toBe(true) })
  it('rejects gibberish', () => { expect(loginSchema.safeParse({ identifier: 'xx' }).success).toBe(false) })
  it('rejects empty', () => { expect(loginSchema.safeParse({ identifier: '' }).success).toBe(false) })
})
