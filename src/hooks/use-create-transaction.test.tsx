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
})
