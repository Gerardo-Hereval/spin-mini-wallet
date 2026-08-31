import { describe, it, expect, beforeEach } from 'vitest'
import { POST } from './route'
import { encodeSession } from '@/lib/session'
import { store } from '@/lib/mock/store'

function req(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/transactions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: `session=${encodeSession({ id: 'u1', name: 'Carlos' })}`,
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/transactions', () => {
  it('returns success and charges once for a valid tx', async () => {
    const before = store.getBalanceCents()
    const res = await POST(req(
      { amountCents: 1000, recipientId: 'c1' },
      { 'x-mock-outcome': 'success', 'idempotency-key': 'k1' },
    ))
    const json = await res.json()
    expect(json.status).toBe('success')
    expect(store.getBalanceCents()).toBe(before - 1000)
  })
  it('is idempotent: same key does not double-charge', async () => {
    const balanceAfterFirst = store.getBalanceCents()
    const res = await POST(req(
      { amountCents: 1000, recipientId: 'c1' },
      { 'x-mock-outcome': 'success', 'idempotency-key': 'k1' },
    ))
    const json = await res.json()
    expect(json.status).toBe('success')
    expect(store.getBalanceCents()).toBe(balanceAfterFirst) // unchanged
  })
  it('rejects an over-balance amount with insufficient_funds (422)', async () => {
    const res = await POST(req(
      { amountCents: 99_999_999, recipientId: 'c1' },
      { 'idempotency-key': 'k2' },
    ))
    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.status).toBe('insufficient_funds')
  })
  it('forces a network_error outcome without charging', async () => {
    const before = store.getBalanceCents()
    const res = await POST(req(
      { amountCents: 1000, recipientId: 'c1' },
      { 'x-mock-outcome': 'network_error', 'idempotency-key': 'k3' },
    ))
    const json = await res.json()
    expect(json.status).toBe('network_error')
    expect(store.getBalanceCents()).toBe(before)
  })
})
