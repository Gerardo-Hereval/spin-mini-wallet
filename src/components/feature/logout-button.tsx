'use client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api-client'
import { useSessionStore } from '@/stores/session-store'

export function LogoutButton() {
  const router = useRouter()
  const clear = useSessionStore((s) => s.clear)
  async function logout() {
    await apiClient.post('/api/auth/logout', {})
    clear()
    router.push('/login')
  }
  return <Button variant="outline" onClick={logout}>Salir</Button>
}
