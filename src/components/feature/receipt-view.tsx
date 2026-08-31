import Link from 'next/link'
import { formatMoney } from '@/domain/money/money'
import type { Receipt } from '@/domain/transaction/types'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function ReceiptView({ receipt }: { receipt: Receipt }) {
  return (
    <Card className="flex flex-col items-center gap-2 p-6" data-testid="receipt">
      <p className="text-lg font-semibold text-cyan-400">¡Transacción exitosa!</p>
      <p className="text-2xl font-bold">{formatMoney(receipt.amountCents)}</p>
      <p className="opacity-70">Para {receipt.recipient.name}</p>
      <p className="text-xs opacity-50">ID: {receipt.id}</p>
      <Link href="/home" className={buttonVariants({ className: 'mt-2' })}>Volver al inicio</Link>
    </Card>
  )
}
