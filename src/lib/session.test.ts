import { describe, it, expect } from 'vitest'
import { encodeSession, decodeSession, readSessionFromCookieHeader, SESSION_COOKIE } from './session'

describe('session token', () => {
  it('round-trips a user', () => {
    const token = encodeSession({ id: 'u1', name: 'Carlos' })
    expect(decodeSession(token)).toEqual({ id: 'u1', name: 'Carlos' })
  })
  it('returns null for undefined', () => { expect(decodeSession(undefined)).toBeNull() })
  it('returns null for garbage', () => { expect(decodeSession('!!!')).toBeNull() })
})

describe('readSessionFromCookieHeader', () => {
  it('reads the session user from a Cookie header', () => {
    const token = encodeSession({ id: 'u1', name: 'Carlos' })
    const header = `foo=bar; ${SESSION_COOKIE}=${token}; baz=qux`
    expect(readSessionFromCookieHeader(header)).toEqual({ id: 'u1', name: 'Carlos' })
  })
  it('returns null when the cookie is absent', () => {
    expect(readSessionFromCookieHeader('foo=bar')).toBeNull()
  })
  it('returns null for a null header', () => {
    expect(readSessionFromCookieHeader(null)).toBeNull()
  })
})
