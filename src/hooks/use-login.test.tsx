import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useLogin } from './use-login'
import type { ReactNode } from 'react'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))

const wrapper = ({ children }: { children: ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('useLogin', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ user: { id: 'u1', name: 'Carlos' } }), { status: 200 })))
  })
  it('rejects an invalid identifier without calling the API', async () => {
    const { result } = renderHook(() => useLogin(), { wrapper })
    await act(async () => { await result.current.submit('xx') })
    expect(result.current.error).toBeTruthy()
    expect(fetch).not.toHaveBeenCalled()
  })
  it('logs in with a valid email', async () => {
    const { result } = renderHook(() => useLogin(), { wrapper })
    await act(async () => { await result.current.submit('a@b.com') })
    await waitFor(() => expect(fetch).toHaveBeenCalled())
  })
})
