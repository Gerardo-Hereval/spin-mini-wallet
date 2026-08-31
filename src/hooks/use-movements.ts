'use client'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Movement } from '@/domain/movement/types'

export function useMovements(initialData?: { movements: Movement[] }) {
  return useQuery({
    queryKey: ['movements'],
    queryFn: () => apiClient.get<{ movements: Movement[] }>('/api/movements'),
    initialData,
  })
}
