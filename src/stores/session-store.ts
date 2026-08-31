'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/domain/session/types'

interface SessionState {
  user: User | null
  setUser: (u: User) => void
  clear: () => void
}
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({ user: null, setUser: (user) => set({ user }), clear: () => set({ user: null }) }),
    { name: 'wallet-session' },
  ),
)
