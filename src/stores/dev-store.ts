'use client'
import { create } from 'zustand'

/**
 * Dev-only UI state: forces the next transaction's simulated outcome so the
 * happy/error paths can be validated deterministically. Never used in
 * production — the toggle that sets it is not rendered there, and the API
 * ignores the x-mock-outcome header outside development.
 */
interface DevState {
  forcedOutcome: string | null
  setForcedOutcome: (outcome: string | null) => void
}

export const useDevStore = create<DevState>((set) => ({
  forcedOutcome: null,
  setForcedOutcome: (forcedOutcome) => set({ forcedOutcome }),
}))
