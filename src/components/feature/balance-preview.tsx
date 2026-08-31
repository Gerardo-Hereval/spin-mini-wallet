import { formatMoney, type Cents } from '@/domain/money/money'

export function BalancePreview({ balanceCents, afterCents }: {
  balanceCents: Cents
  afterCents?: Cents
}) {
  const negative = afterCents !== undefined && afterCents < 0
  return (
    <div className="rounded-lg border border-border bg-card/40 p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="opacity-70">Saldo disponible</span>
        <span className="font-medium">{formatMoney(balanceCents)}</span>
      </div>
      {afterCents !== undefined && (
        <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-2">
          <span className="opacity-70">Después de enviar</span>
          <span className={negative ? 'font-semibold text-destructive' : 'font-semibold text-primary'}>
            {formatMoney(afterCents)}
          </span>
        </div>
      )}
    </div>
  )
}
