import { describe, it, expect } from 'vitest'
import { initials } from './initials'

describe('initials', () => {
  it('takes first + last initial', () => { expect(initials('Ana Díaz')).toBe('AD') })
  it('uses two letters for a single name', () => { expect(initials('Luis')).toBe('LU') })
  it('handles extra spaces', () => { expect(initials('  Ana   María  Díaz ')).toBe('AD') })
  it('falls back for empty input', () => { expect(initials('')).toBe('?') })
})
