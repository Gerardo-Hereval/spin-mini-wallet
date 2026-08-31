import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCreateTransaction } from './use-create-transaction'
import type { ReactNode } from 'react'

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () =>
    new Response(JSON.stringify({ status: 'network_error' }), { status: 502 }),
  ))
})

describe('useCreateTransaction', () => {
  it('maps a non-success HTTP body to a TransactionResult', async () => {
    const { result } = renderHook(() => useCreateTransaction(), { wrapper })
    result.current.mutate({ amountCents: 1000, recipientId: 'c1' })
    await waitFor(() => expect(result.current.data?.status).toBe('network_error'))
  })

  it('reuses idempotency key across mutation retries', async () => {
    const capturedKeys: string[] = []
    let callCount = 0

    const mockFetch = vi.fn(async (url: string, init?: RequestInit) => {
      callCount++
      const hdrs = init?.headers
      let key: string | undefined
      if (hdrs instanceof Headers) {
        key = hdrs.get('idempotency-key') ?? undefined
      } else if (typeof hdrs === 'object' && hdrs !== null) {
        key = (hdrs as Record<string, string>)['idempotency-key']
      }
      if (key) capturedKeys.push(key)

      if (callCount < 3) {
        throw new Error('network down')
      }
      return new Response(JSON.stringify({ status: 'success', receipt: { id: 'txn_123' } }))
    })

    vi.stubGlobal('fetch', mockFetch)

    function retryWrapper({ children }: { children: ReactNode }) {
      const qc = new QueryClient()
      return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    }

    const { result } = renderHook(() => useCreateTransaction(), { wrapper: retryWrapper })
    result.current.mutate({ amountCents: 1000, recipientId: 'c1' })

    await waitFor(() => {
      expect(result.current.data?.status).toBe('success')
    }, { timeout: 5000 })
    expect(callCount).toBe(3)
    expect(capturedKeys).toHaveLength(3)
    expect(capturedKeys[0]).toBe(capturedKeys[1])
    expect(capturedKeys[1]).toBe(capturedKeys[2])
  })
})
