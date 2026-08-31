import { formatMoney, type Cents } from '@/domain/money/money'
import { Card } from '@/components/ui/card'

export function BalanceCard({ name, balanceCents }: { name: string; balanceCents: Cents }) {
  return (
    <Card className="p-6">
      <p className="text-sm opacity-70">Saldo disponible</p>
      <p className="text-3xl font-bold">{formatMoney(balanceCents)}</p>
      <p className="mt-1 text-sm opacity-70">{name}</p>
    </Card>
  )
}
