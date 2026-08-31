'use client'
import { create } from 'zustand'

interface DevState {
  forcedOutcome: string | null
  setForcedOutcome: (outcome: string | null) => void
}

export const useDevStore = create<DevState>((set) => ({
  forcedOutcome: null,
  setForcedOutcome: (forcedOutcome) => set({ forcedOutcome }),
}))
