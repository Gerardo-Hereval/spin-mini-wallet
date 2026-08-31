import { Button } from '@/components/ui/button'

const MESSAGES: Record<string, string> = {
  network_error: 'Problema de red. Verifica tu conexión.',
  timeout: 'La operación tardó demasiado.',
  insufficient_funds: 'Fondos insuficientes para esta transacción.',
  unknown_error: 'Algo salió mal. Intenta más tarde.',
}
export function ErrorState({ status, onRetry }: { status: string; onRetry?: () => void }) {
  const retryable = status === 'network_error' || status === 'timeout'
  return (
    <div className="flex flex-col items-center gap-3" role="alert">
      <p>{MESSAGES[status] ?? MESSAGES.unknown_error}</p>
      {retryable && onRetry && <Button onClick={onRetry}>Reintentar</Button>}
    </div>
  )
}
