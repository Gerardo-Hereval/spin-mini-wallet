'use client'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Cents } from '@/domain/money/money'
import type { User } from '@/domain/session/types'

interface WalletDto { user: User; balanceCents: Cents }
export function useWallet(initialData?: WalletDto) {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: () => apiClient.get<WalletDto>('/api/wallet'),
    initialData,
  })
}
