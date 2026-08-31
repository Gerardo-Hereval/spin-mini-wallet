import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useLogin } from './use-login'
import type { ReactNode } from 'react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

const wrapper = ({ children }: { children: ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('useLogin', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ user: { id: 'u1', name: 'Carlos' } }), { status: 200 })))
  })

  it('does not call the API when the identifier is invalid', async () => {
    const { result } = renderHook(() => useLogin(), { wrapper })
    act(() => { result.current.setIdentifier('xx'); result.current.setPassword('secret123') })
    await act(async () => { await result.current.submit() })
    expect(result.current.errors.identifier).toBeTruthy()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('does not call the API when the password is too short', async () => {
    const { result } = renderHook(() => useLogin(), { wrapper })
    act(() => { result.current.setIdentifier('a@b.com'); result.current.setPassword('123') })
    await act(async () => { await result.current.submit() })
    expect(result.current.errors.password).toBeTruthy()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('logs in with a valid identifier + password', async () => {
    const { result } = renderHook(() => useLogin(), { wrapper })
    act(() => { result.current.setIdentifier('a@b.com'); result.current.setPassword('secret123') })
    await act(async () => { await result.current.submit() })
    await waitFor(() => expect(fetch).toHaveBeenCalled())
  })
})
