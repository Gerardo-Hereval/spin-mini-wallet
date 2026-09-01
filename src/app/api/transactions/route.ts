import { NextResponse } from 'next/server'
import { transactionSchema } from '@/lib/validation/schemas'
import { store } from '@/lib/db/store'
import { fromCents } from '@/domain/money/money'
import { validateTransaction } from '@/domain/transaction/rules'
import type { TransactionResult } from '@/domain/transaction/types'
import type { Contact } from '@/domain/contact/types'
import { pickOutcome } from '@/lib/mock/outcome'
import { randomDelay } from '@/lib/mock/latency'
import { readSessionFromCookieHeader } from '@/lib/session'

export async function POST(req: Request) {
  const user = readSessionFromCookieHeader(req.headers.get('cookie'))
  if (!user) return NextResponse.json({ status: 'unknown_error' } satisfies TransactionResult, { status: 401 })

  const key = req.headers.get('idempotency-key')
  if (!key) return NextResponse.json({ status: 'unknown_error' } satisfies TransactionResult, { status: 400 })

  const existing = store.getReceiptByKey(key)
  if (existing) {
    return NextResponse.json({ status: 'success', receipt: existing } satisfies TransactionResult)
  }

  if (!store.beginKey(key)) {
    return NextResponse.json({ status: 'unknown_error' } satisfies TransactionResult, { status: 409 })
  }

  try {
    const body = await req.json().catch(() => null)
    const parsed = transactionSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ status: 'unknown_error' } satisfies TransactionResult, { status: 422 })

    const { amountCents, recipientId, newContact } = parsed.data
    const recipient: Contact | null = newContact
      ? { id: 'pending', name: newContact.name, handle: newContact.handle }
      : store.listContacts().find((c) => c.id === recipientId) ?? null

    const check = validateTransaction(
      { amountCents: fromCents(amountCents), recipient },
      { balanceCents: store.getBalanceCents() },
    )
    if (!check.ok) {
      const insufficient = check.errors.some((e) => e.code === 'insufficient_balance')
      const status: TransactionResult['status'] = insufficient ? 'insufficient_funds' : 'unknown_error'
      return NextResponse.json({ status } satisfies TransactionResult, { status: 422 })
    }

    const forced = process.env.NODE_ENV !== 'production' ? req.headers.get('x-mock-outcome') : null
    const outcome = pickOutcome(forced)
    if (outcome === 'timeout') { await randomDelay(9000, 12000) }

    if (outcome !== 'success') {
      const code = outcome === 'insufficient_funds' ? 422 : 502
      return NextResponse.json({ status: outcome } satisfies TransactionResult, { status: code })
    }

    let finalRecipient = check.input.recipient
    if (newContact && finalRecipient.id === 'pending') {
      finalRecipient = store.addContact(newContact.name, newContact.handle)
    }

    await randomDelay(300, 700)
    const receipt = store.applyTransaction(check.input.amountCents, finalRecipient, key)
    return NextResponse.json({ status: 'success', receipt } satisfies TransactionResult)
  } finally {
    store.endKey(key)
  }
}
