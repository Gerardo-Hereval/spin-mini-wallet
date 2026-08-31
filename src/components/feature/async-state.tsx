import type { ReactNode } from 'react'

interface Props {
  isLoading: boolean
  isError: boolean
  isEmpty: boolean
  loading?: ReactNode
  error?: ReactNode
  empty?: ReactNode
  children: ReactNode
}
export function AsyncState({ isLoading, isError, isEmpty, loading, error, empty, children }: Props) {
  if (isLoading) return <>{loading ?? <p>Cargando…</p>}</>
  if (isError) return <>{error ?? <p role="alert">Ocurrió un error.</p>}</>
  if (isEmpty) return <>{empty ?? <p>Sin datos.</p>}</>
  return <>{children}</>
}
