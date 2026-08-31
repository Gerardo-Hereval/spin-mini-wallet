import { store } from '@/lib/mock/store'
import { HomeView } from '@/components/feature/home-view'

export default function HomePage() {
  const wallet = store.getWallet()
  const movements = store.getMovements()
  return <HomeView initialWallet={wallet} initialMovements={movements} />
}
