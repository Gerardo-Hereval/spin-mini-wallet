'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useSessionStore } from '@/stores/session-store'

export function useResetDemo() {
  const router = useRouter()
  const qc = useQueryClient()
  const clear = useSessionStore((s) => s.clear)
  const [isPending, setPending] = useState(false)

  async function reset() {
    setPending(true)
    try {
      await apiClient.post('/api/dev/reset', {})
      clear()
      qc.clear()
      router.push('/login')
      router.refresh()
    } finally {
      setPending(false)
    }
  }
  return { reset, isPending }
}
