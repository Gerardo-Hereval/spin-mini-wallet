'use client'
import { create } from 'zustand'
import type { Contact } from '@/domain/contact/types'

type Step = 'amount' | 'recipient' | 'summary' | 'result'
interface TransferState {
  step: Step
  amountRaw: string
  recipient: Contact | null
  setAmountRaw: (v: string) => void
  setRecipient: (c: Contact | null) => void
  goto: (s: Step) => void
  reset: () => void
}
export const useTransferStore = create<TransferState>((set) => ({
  step: 'amount', amountRaw: '', recipient: null,
  setAmountRaw: (amountRaw) => set({ amountRaw }),
  setRecipient: (recipient) => set({ recipient }),
  goto: (step) => set({ step }),
  reset: () => set({ step: 'amount', amountRaw: '', recipient: null }),
}))
