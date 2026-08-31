'use client'
import { Button } from '@/components/ui/button'
import { useShareReceipt } from '@/hooks/use-share-receipt'
import type { Receipt } from '@/domain/transaction/types'

const FEEDBACK: Record<string, string> = {
  sharing: 'Generando imagen…',
  shared: 'Comprobante compartido ✓',
  downloaded: 'Imagen descargada ✓',
  error: 'No se pudo compartir',
}

export function ReceiptShareButton({ receipt }: { receipt: Receipt }) {
  const { share, status } = useShareReceipt(receipt)
  return (
    <div className="flex flex-col items-center gap-1">
      <Button variant="outline" onClick={share} disabled={status === 'sharing'}>
        Compartir comprobante
      </Button>
      {status !== 'idle' && FEEDBACK[status] && (
        <span role="status" className="text-xs opacity-70">{FEEDBACK[status]}</span>
      )}
    </div>
  )
}
