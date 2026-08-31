'use client'
import { useState } from 'react'
import { useWallet } from '@/hooks/use-wallet'
import { useContacts, useAddContact } from '@/hooks/use-contacts'
import { useCreateTransaction } from '@/hooks/use-create-transaction'
import { useTransferStore } from '@/stores/transfer-store'
import { useTransferForm } from '@/hooks/use-transfer-form'
import { fromCents, type Cents } from '@/domain/money/money'
import { AmountInput } from './amount-input'
import { ContactPicker } from './contact-picker'
import { TransferSummary } from './transfer-summary'
import { ReceiptView } from './receipt-view'
import { ErrorState } from './error-state'
import { AsyncState } from './async-state'
import { Button } from '@/components/ui/button'
import type { TransactionResult } from '@/domain/transaction/types'

const ERROR_CODE_MESSAGES: Record<string, string> = {
  amount_required: 'Ingresa un monto.',
  amount_not_positive: 'El monto debe ser mayor a cero.',
  insufficient_balance: 'El monto supera tu saldo.',
}

export function TransferWizard() {
  const wallet = useWallet()
  const balanceReady = wallet.data !== undefined && !wallet.isLoading
  const balance = wallet.data?.balanceCents ?? fromCents(0)
  const { step, amountRaw, recipient, setAmountRaw, setRecipient, goto, reset } = useTransferStore()
  const form = useTransferForm({ amountRaw, recipient, balanceCents: balance })
  const contacts = useContacts()
  const addContact = useAddContact()
  const createTx = useCreateTransaction()
  const [result, setResult] = useState<TransactionResult | null>(null)
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null)

  const amountError = form.errors.find((e) => e.code !== 'recipient_required')
  const amountErrorMsg = balanceReady && amountError ? ERROR_CODE_MESSAGES[amountError.code] : undefined

  async function confirm() {
    const key = idempotencyKey ?? `txn_${Date.now()}_${Math.floor(Math.random() * 1e6)}`
    setIdempotencyKey(key)
    const res = await createTx.mutateAsync({
      amountCents: form.amountCents ?? 0,
      recipientId: recipient?.id,
      idempotencyKey: key,
    })
    setResult(res)
    goto('result')
  }

  function retry() { void confirm() }

  function startNew() {
    reset()
    setIdempotencyKey(null)
    setResult(null)
  }

  function renderStep() {
    if (step === 'amount') {
      return (
        <div className="flex flex-col gap-4">
          <AmountInput value={amountRaw} onChange={setAmountRaw} error={amountRaw ? amountErrorMsg : undefined} />
          <Button disabled={!balanceReady || !!amountErrorMsg || amountRaw.trim() === ''} onClick={() => goto('recipient')}>Continuar</Button>
        </div>
      )
    }
    if (step === 'recipient') {
      return (
        <div className="flex flex-col gap-4">
          <AsyncState isLoading={contacts.isLoading} isError={contacts.isError} isEmpty={false}>
            {contacts.data && (
              <ContactPicker
                contacts={contacts.data.contacts}
                selectedId={recipient?.id ?? null}
                onSelect={setRecipient}
                onCreate={async (name, handle) => {
                  const { contact } = await addContact.mutateAsync({ name, handle })
                  setRecipient(contact)
                }}
              />
            )}
          </AsyncState>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => goto('amount')}>Atrás</Button>
            <Button disabled={!recipient} onClick={() => goto('summary')}>Continuar</Button>
          </div>
        </div>
      )
    }
    if (step === 'summary' && recipient && form.amountCents !== null) {
      return (
        <TransferSummary
          amountCents={form.amountCents}
          recipient={recipient}
          balanceAfterCents={fromCents(balance - form.amountCents) as Cents}
          onConfirm={confirm}
          onBack={() => goto('recipient')}
          isPending={createTx.isPending}
          canConfirm={form.isValid}
        />
      )
    }
    if (step === 'result' && result) {
      return (
        <div className="flex flex-col gap-4">
          {result.status === 'success'
            ? <ReceiptView receipt={result.receipt} />
            : <ErrorState status={result.status} onRetry={retry} />}
          <div className="flex justify-center">
            <Button variant="ghost" onClick={startNew}>Nueva transacción</Button>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] w-full flex-col items-center justify-center py-6">
      <div className="w-full max-w-md">{renderStep()}</div>
    </div>
  )
}
