import type { Cents } from '@/domain/money/money'
import { fromCents } from '@/domain/money/money'
import type { Contact } from '@/domain/contact/types'
import type { Movement } from '@/domain/movement/types'
import type { Receipt } from '@/domain/transaction/types'
import { SEED_USER, SEED_BALANCE, SEED_CONTACTS, SEED_MOVEMENTS } from './data'

// In-memory singleton (survives within a running process only).
const g = globalThis as unknown as { __wallet?: WalletState }
interface WalletState {
  user: typeof SEED_USER
  balanceCents: Cents
  contacts: Contact[]
  movements: Movement[]
  receiptsByKey: Map<string, Receipt>
  seq: number
}
function state(): WalletState {
  if (!g.__wallet) {
    g.__wallet = {
      user: SEED_USER, balanceCents: SEED_BALANCE,
      contacts: [...SEED_CONTACTS], movements: [...SEED_MOVEMENTS],
      receiptsByKey: new Map(), seq: 100,
    }
  }
  return g.__wallet
}
const nextId = (p: string) => `${p}${state().seq++}`

export const store = {
  getUser: () => state().user,
  getBalanceCents: () => state().balanceCents,
  getWallet: () => ({ user: state().user, balanceCents: state().balanceCents }),
  getMovements: () => state().movements,
  listContacts: () => state().contacts,
  addContact(name: string, handle: string): Contact {
    const c: Contact = { id: nextId('c'), name, handle }
    state().contacts.unshift(c)
    return c
  },
  getReceiptByKey: (key: string) => state().receiptsByKey.get(key),
  applyTransaction(amountCents: Cents, recipient: Contact, key: string): Receipt {
    const s = state()
    const receipt: Receipt = {
      id: nextId('t'), amountCents, recipient, createdAt: new Date().toISOString(),
    }
    s.balanceCents = fromCents(s.balanceCents - amountCents)
    s.movements.unshift({
      id: nextId('m'), description: `Envío a ${recipient.name}`,
      amountCents, direction: 'out', createdAt: receipt.createdAt,
    })
    s.receiptsByKey.set(key, receipt)
    return receipt
  },
}
