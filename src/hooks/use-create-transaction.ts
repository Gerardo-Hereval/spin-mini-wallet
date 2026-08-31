'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { TransactionResult } from '@/domain/transaction/types'

export interface TransferPayload {
  amountCents: number
  recipientId?: string
  newContact?: { name: string; handle: string }
  forcedOutcome?: string
}

function newKey(): string {
  return `txn_${Date.now()}_${Math.floor(Math.random() * 1e6)}`
}

export function useCreateTransaction() {
  const qc = useQueryClient()
  return useMutation<TransactionResult, Error, TransferPayload & { idempotencyKey?: string }>({
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000) + Math.random() * 200,
    mutationFn: async (payload) => {
      payload.idempotencyKey ??= newKey()
      const key = payload.idempotencyKey
      const headers: Record<string, string> = { 'idempotency-key': key }
      if (payload.forcedOutcome) headers['x-mock-outcome'] = payload.forcedOutcome
      const res = await apiClient.raw('/api/transactions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers },
        body: JSON.stringify(payload),
      })
      return (await res.json()) as TransactionResult
    },
    onSuccess: (result) => {
      if (result.status === 'success') {
        qc.invalidateQueries({ queryKey: ['wallet'] })
        qc.invalidateQueries({ queryKey: ['movements'] })
      }
    },
  })
}
