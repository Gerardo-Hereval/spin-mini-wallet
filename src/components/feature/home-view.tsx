'use client'
import Link from 'next/link'
import { useWallet } from '@/hooks/use-wallet'
import { useMovements } from '@/hooks/use-movements'
import { BalanceCard } from './balance-card'
import { MovementList } from './movement-list'
import { AsyncState } from './async-state'
import { buttonVariants } from '@/components/ui/button'
import type { Cents } from '@/domain/money/money'
import type { User } from '@/domain/session/types'
import type { Movement } from '@/domain/movement/types'

interface Props {
  initialWallet: { user: User; balanceCents: Cents }
  initialMovements: Movement[]
}
export function HomeView({ initialWallet, initialMovements }: Props) {
  const wallet = useWallet(initialWallet)
  const movements = useMovements({ movements: initialMovements })
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      {wallet.data && <BalanceCard name={wallet.data.user.name} balanceCents={wallet.data.balanceCents} />}
      <Link href="/transfer" className={buttonVariants()}>Nueva transacción</Link>
      <section>
        <h2 className="mb-2 font-semibold">Movimientos recientes</h2>
        <AsyncState
          isLoading={movements.isLoading}
          isError={movements.isError}
          isEmpty={!!movements.data && movements.data.movements.length === 0}
          empty={<p>Aún no tienes movimientos.</p>}
        >
          {movements.data && <MovementList movements={movements.data.movements} />}
        </AsyncState>
      </section>
    </div>
  )
}
