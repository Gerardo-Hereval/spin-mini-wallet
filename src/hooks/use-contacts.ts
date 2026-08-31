'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Contact } from '@/domain/contact/types'

export function useContacts() {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: () => apiClient.get<{ contacts: Contact[] }>('/api/contacts'),
  })
}
export function useAddContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; handle: string }) =>
      apiClient.post<{ contact: Contact }>('/api/contacts', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  })
}
