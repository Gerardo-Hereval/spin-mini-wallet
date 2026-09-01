import { dirname } from 'node:path'
import { mkdirSync } from 'node:fs'
import Database from 'better-sqlite3'
import { SEED_USER, SEED_BALANCE, SEED_CONTACTS, SEED_MOVEMENTS } from '@/lib/mock/data'

interface DbState {
  db: Database.Database
  seq: number
  inFlight: Set<string>
}

const globalRef = globalThis as unknown as { __walletDb?: DbState }

function resolveDbPath(): string {
  if (process.env.NODE_ENV === 'test') return ':memory:'
  return process.env.DATABASE_PATH ?? './data/wallet.db'
}

function createSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS wallet (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      balance_cents INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      handle TEXT NOT NULL,
      sort INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS movements (
      id TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      direction TEXT NOT NULL,
      created_at TEXT NOT NULL,
      sort INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS receipts (
      idempotency_key TEXT PRIMARY KEY,
      id TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      recipient_id TEXT NOT NULL,
      recipient_name TEXT NOT NULL,
      recipient_handle TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `)
}

export function applySeed(db: Database.Database): void {
  db.prepare('INSERT INTO wallet (id, user_id, user_name, balance_cents) VALUES (1, ?, ?, ?)')
    .run(SEED_USER.id, SEED_USER.name, SEED_BALANCE)
  const insContact = db.prepare('INSERT INTO contacts (id, name, handle, sort) VALUES (?, ?, ?, 0)')
  for (const c of SEED_CONTACTS) insContact.run(c.id, c.name, c.handle)
  const insMovement = db.prepare(
    'INSERT INTO movements (id, description, amount_cents, direction, created_at, sort) VALUES (?, ?, ?, ?, ?, 0)',
  )
  for (const m of SEED_MOVEMENTS) insMovement.run(m.id, m.description, m.amountCents, m.direction, m.createdAt)
}

export function getDbState(): DbState {
  if (!globalRef.__walletDb) {
    const path = resolveDbPath()
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })
    const db = new Database(path)
    db.pragma('journal_mode = WAL')
    createSchema(db)
    const seeded = db.prepare('SELECT COUNT(*) AS c FROM wallet').get() as { c: number }
    if (seeded.c === 0) applySeed(db)
    globalRef.__walletDb = { db, seq: 100, inFlight: new Set() }
  }
  return globalRef.__walletDb
}
