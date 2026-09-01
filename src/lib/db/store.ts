import type { Cents } from '@/domain/money/money'
import { fromCents } from '@/domain/money/money'
import type { Contact } from '@/domain/contact/types'
import type { Movement } from '@/domain/movement/types'
import type { User } from '@/domain/session/types'
import type { Receipt } from '@/domain/transaction/types'
import { applySeed, getDbState } from './connection'

interface WalletRow { user_id: string; user_name: string; balance_cents: number }
interface ContactRow { id: string; name: string; handle: string }
interface MovementRow { id: string; description: string; amount_cents: number; direction: 'in' | 'out'; created_at: string }
interface ReceiptRow {
  id: string
  amount_cents: number
  recipient_id: string
  recipient_name: string
  recipient_handle: string
  created_at: string
}

function nextId(prefix: string): string {
  const state = getDbState()
  return `${prefix}${state.seq++}`
}

function toReceipt(row: ReceiptRow): Receipt {
  return {
    id: row.id,
    amountCents: fromCents(row.amount_cents),
    recipient: { id: row.recipient_id, name: row.recipient_name, handle: row.recipient_handle },
    createdAt: row.created_at,
  }
}

export const store = {
  getUser(): User {
    const row = getDbState().db.prepare('SELECT user_id, user_name FROM wallet WHERE id = 1').get() as WalletRow
    return { id: row.user_id, name: row.user_name }
  },

  getBalanceCents(): Cents {
    const row = getDbState().db.prepare('SELECT balance_cents FROM wallet WHERE id = 1').get() as WalletRow
    return fromCents(row.balance_cents)
  },

  getWallet(): { user: User; balanceCents: Cents } {
    return { user: this.getUser(), balanceCents: this.getBalanceCents() }
  },

  getMovements(): Movement[] {
    const rows = getDbState().db
      .prepare('SELECT id, description, amount_cents, direction, created_at FROM movements ORDER BY sort DESC, rowid ASC')
      .all() as MovementRow[]
    return rows.map((r) => ({
      id: r.id,
      description: r.description,
      amountCents: fromCents(r.amount_cents),
      direction: r.direction,
      createdAt: r.created_at,
    }))
  },

  listContacts(): Contact[] {
    const rows = getDbState().db
      .prepare('SELECT id, name, handle FROM contacts ORDER BY sort DESC, rowid ASC')
      .all() as ContactRow[]
    return rows.map((r) => ({ id: r.id, name: r.name, handle: r.handle }))
  },

  addContact(name: string, handle: string): Contact {
    const state = getDbState()
    const id = nextId('c')
    state.db.prepare('INSERT INTO contacts (id, name, handle, sort) VALUES (?, ?, ?, ?)').run(id, name, handle, state.seq)
    return { id, name, handle }
  },

  getReceiptByKey(key: string): Receipt | undefined {
    const row = getDbState().db.prepare('SELECT * FROM receipts WHERE idempotency_key = ?').get(key) as ReceiptRow | undefined
    return row ? toReceipt(row) : undefined
  },

  beginKey(key: string): boolean {
    const state = getDbState()
    if (state.inFlight.has(key)) return false
    const existing = state.db.prepare('SELECT 1 FROM receipts WHERE idempotency_key = ?').get(key)
    if (existing) return false
    state.inFlight.add(key)
    return true
  },

  endKey(key: string): void {
    getDbState().inFlight.delete(key)
  },

  applyTransaction(amountCents: Cents, recipient: Contact, key: string): Receipt {
    const state = getDbState()
    const db = state.db
    const receipt: Receipt = { id: nextId('t'), amountCents, recipient, createdAt: new Date().toISOString() }
    const run = db.transaction(() => {
      db.prepare('UPDATE wallet SET balance_cents = balance_cents - ? WHERE id = 1').run(amountCents)
      db.prepare(
        'INSERT INTO movements (id, description, amount_cents, direction, created_at, sort) VALUES (?, ?, ?, ?, ?, ?)',
      ).run(nextId('m'), `Envío a ${recipient.name}`, amountCents, 'out', receipt.createdAt, state.seq)
      db.prepare(
        'INSERT INTO receipts (idempotency_key, id, amount_cents, recipient_id, recipient_name, recipient_handle, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ).run(key, receipt.id, amountCents, recipient.id, recipient.name, recipient.handle, receipt.createdAt)
    })
    run()
    return receipt
  },

  reset(): void {
    const state = getDbState()
    const db = state.db
    db.exec('DELETE FROM receipts; DELETE FROM movements; DELETE FROM contacts; DELETE FROM wallet;')
    state.seq = 100
    state.inFlight.clear()
    applySeed(db)
  },
}
