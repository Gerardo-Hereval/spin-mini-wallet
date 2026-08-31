import { describe, it, expect } from 'vitest'
import { pickOutcome, OUTCOME_NAMES } from './outcome'

describe('pickOutcome', () => {
  it('honors a forced valid outcome', () => {
    expect(pickOutcome('timeout')).toBe('timeout')
    expect(pickOutcome('insufficient_funds')).toBe('insufficient_funds')
  })
  it('ignores an invalid forced value and returns a valid outcome', () => {
    const r = pickOutcome('garbage')
    expect(OUTCOME_NAMES).toContain(r)
  })
  it('returns a valid outcome when unforced', () => {
    const r = pickOutcome(null)
    expect(OUTCOME_NAMES).toContain(r)
  })
})
