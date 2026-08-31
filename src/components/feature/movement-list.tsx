import { formatMoney } from '@/domain/money/money'
import type { Movement } from '@/domain/movement/types'

export function MovementList({ movements }: { movements: Movement[] }) {
  return (
    <ul className="divide-y" data-testid="movement-list">
      {movements.map((m) => (
        <li key={m.id} className="flex justify-between py-3">
          <span>{m.description}</span>
          <span className={m.direction === 'in' ? 'text-emerald-400' : 'text-red-400'}>
            {m.direction === 'in' ? '+' : '−'}{formatMoney(m.amountCents)}
          </span>
        </li>
      ))}
    </ul>
  )
}
