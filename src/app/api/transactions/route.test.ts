import { describe, it, expect } from 'vitest'
import { POST } from './route'
import { encodeSession } from '@/lib/session'
import { store } from '@/lib/db/store'

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
    expect(store.getBalanceCents()).toBe(balanceAfterFirst)
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
  it('newContact transaction that fails validation does NOT persist contact', async () => {
    const before = store.listContacts().length
    const res = await POST(req(
      { amountCents: 99_999_999, newContact: { name: 'Alice', handle: '@alice' } },
      { 'idempotency-key': 'k4' },
    ))
    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.status).toBe('insufficient_funds')
    expect(store.listContacts().length).toBe(before)
  })
  it('newContact transaction that succeeds creates exactly one contact', async () => {
    const before = store.listContacts().length
    const res = await POST(req(
      { amountCents: 1000, newContact: { name: 'Bob', handle: '@bob' } },
      { 'x-mock-outcome': 'success', 'idempotency-key': 'k5' },
    ))
    const json = await res.json()
    expect(json.status).toBe('success')
    expect(store.listContacts().length).toBe(before + 1)
  })
  it('missing Idempotency-Key header returns 400', async () => {
    const res = await POST(req(
      { amountCents: 1000, recipientId: 'c1' },
      { 'x-mock-outcome': 'success' },
    ))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.status).toBe('unknown_error')
  })
  it('missing/invalid session cookie returns 401', async () => {
    const res = new Request('http://localhost/api/transactions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': 'k6',
      },
      body: JSON.stringify({ amountCents: 1000, recipientId: 'c1' }),
    })
    const result = await POST(res)
    expect(result.status).toBe(401)
    const json = await result.json()
    expect(json.status).toBe('unknown_error')
  })
})
