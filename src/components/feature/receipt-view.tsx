import Link from 'next/link'
import { formatMoney } from '@/domain/money/money'
import type { Receipt } from '@/domain/transaction/types'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ReceiptShareButton } from './receipt-share-button'

export function ReceiptView({ receipt }: { receipt: Receipt }) {
  return (
    <Card className="flex flex-col items-center gap-2 p-6" data-testid="receipt">
      <p className="text-lg font-semibold text-cyan-400">¡Transacción exitosa!</p>
      <p className="text-2xl font-bold">{formatMoney(receipt.amountCents)}</p>
      <p className="opacity-70">Para {receipt.recipient.name}</p>
      <p className="text-xs opacity-50">ID: {receipt.id}</p>
      <div className="mt-3 flex flex-col items-center gap-2">
        <ReceiptShareButton receipt={receipt} />
        <Link href="/home" className={buttonVariants({ variant: 'ghost' })}>Volver al inicio</Link>
      </div>
    </Card>
  )
}
