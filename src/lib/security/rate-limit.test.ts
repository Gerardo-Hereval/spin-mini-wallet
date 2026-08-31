import { describe, it, expect } from 'vitest'
import { checkRateLimit } from './rate-limit'

describe('checkRateLimit', () => {
  it('allows up to the limit then blocks', () => {
    const key = 'test-key'
    const opts = { limit: 3, windowMs: 60_000 }
    expect(checkRateLimit(key, opts)).toBe(true)
    expect(checkRateLimit(key, opts)).toBe(true)
    expect(checkRateLimit(key, opts)).toBe(true)
    expect(checkRateLimit(key, opts)).toBe(false)
  })
})
