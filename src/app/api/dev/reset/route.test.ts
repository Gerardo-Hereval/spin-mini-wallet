import { describe, it, expect } from 'vitest'
import { POST } from './route'
import { store } from '@/lib/db/store'
import { SEED_BALANCE } from '@/lib/mock/data'
import { fromCents } from '@/domain/money/money'

describe('POST /api/dev/reset', () => {
  it('restores the store to seed balance', async () => {
    const recipient = store.listContacts()[0]
    store.applyTransaction(fromCents(500), recipient, 'reset-test-key')
    expect(store.getBalanceCents()).not.toBe(SEED_BALANCE)

    const res = await POST()
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
    expect(store.getBalanceCents()).toBe(SEED_BALANCE)
  })
})
