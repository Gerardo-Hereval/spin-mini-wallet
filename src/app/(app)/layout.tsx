import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { SESSION_COOKIE, decodeSession } from '@/lib/session'
import { LogoutButton } from '@/components/feature/logout-button'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies()
  const user = decodeSession(cookieStore.get(SESSION_COOKIE)?.value)
  if (!user) redirect('/login')
  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between border-b p-4">
        <span className="font-semibold">Hola, {user.name}</span>
        <LogoutButton />
      </header>
      <main className="p-4">{children}</main>
    </div>
  )
}
