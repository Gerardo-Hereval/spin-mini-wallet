'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { loginSchema } from '@/lib/validation/schemas'
import { useSessionStore } from '@/stores/session-store'
import type { User } from '@/domain/session/types'

export function useLogin() {
  const router = useRouter()
  const setUser = useSessionStore((s) => s.setUser)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (identifier: string) =>
      apiClient.post<{ user: User }>('/api/auth/login', { identifier }),
    onSuccess: ({ user }) => { setUser(user); router.push('/home') },
    onError: () => setError('No pudimos iniciar sesión. Intenta de nuevo.'),
  })

  async function submit(identifier: string) {
    setError(null)
    const parsed = loginSchema.safeParse({ identifier })
    if (!parsed.success) { setError(parsed.error.issues[0].message); return }
    await mutation.mutateAsync(identifier).catch(() => {})
  }

  return { submit, isPending: mutation.isPending, error }
}
