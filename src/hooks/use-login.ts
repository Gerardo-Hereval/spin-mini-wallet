'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { isEmailOrPhone, isValidPassword, MIN_PASSWORD_LENGTH } from '@/lib/validation/identifier'
import { useSessionStore } from '@/stores/session-store'
import type { User } from '@/domain/session/types'

type Field = 'identifier' | 'password'

export function useLogin() {
  const router = useRouter()
  const setUser = useSessionStore((s) => s.setUser)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState<Record<Field, boolean>>({ identifier: false, password: false })
  const [formError, setFormError] = useState<string | null>(null)

  const identifierValid = isEmailOrPhone(identifier)
  const passwordValid = isValidPassword(password)

  const errors = useMemo(() => {
    const e: Partial<Record<Field, string>> = {}
    if (touched.identifier && !identifierValid) e.identifier = 'Ingresa un email o un teléfono de 10 dígitos'
    if (touched.password && !passwordValid) {
      e.password = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`
    }
    return e
  }, [touched, identifierValid, passwordValid])

  const mutation = useMutation({
    mutationFn: (body: { identifier: string; password: string }) =>
      apiClient.post<{ user: User }>('/api/auth/login', body),
    onSuccess: ({ user }) => { setUser(user); router.push('/home') },
    onError: () => setFormError('No pudimos iniciar sesión. Intenta de nuevo.'),
  })

  const canSubmit = identifierValid && passwordValid && !mutation.isPending

  function touch(field: Field) {
    setTouched((t) => ({ ...t, [field]: true }))
  }

  async function submit() {
    setFormError(null)
    setTouched({ identifier: true, password: true })
    if (!identifierValid || !passwordValid) return
    await mutation.mutateAsync({ identifier, password }).catch(() => {})
  }

  return {
    identifier,
    password,
    setIdentifier,
    setPassword,
    touch,
    errors,
    formError,
    canSubmit,
    isPending: mutation.isPending,
    submit,
  }
}
