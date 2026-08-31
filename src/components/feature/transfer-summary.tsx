import { formatMoney, type Cents } from '@/domain/money/money'
import type { Contact } from '@/domain/contact/types'
import { Button } from '@/components/ui/button'

export function TransferSummary({ amountCents, recipient, balanceAfterCents, onConfirm, onBack, isPending, canConfirm }: {
  amountCents: Cents; recipient: Contact; balanceAfterCents: Cents
  onConfirm: () => void; onBack: () => void; isPending: boolean; canConfirm: boolean
}) {
  return (
    <div className="flex flex-col gap-3">
      <p>Enviarás <strong>{formatMoney(amountCents)}</strong> a <strong>{recipient.name}</strong></p>
      <p className="opacity-70">Saldo después: {formatMoney(balanceAfterCents)}</p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} disabled={isPending}>Atrás</Button>
        <Button onClick={onConfirm} disabled={!canConfirm || isPending}>
          {isPending ? 'Confirmando…' : 'Confirmar'}
        </Button>
      </div>
    </div>
  )
}
