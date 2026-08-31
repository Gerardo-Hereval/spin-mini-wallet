import { formatMoney } from '@/domain/money/money'
import type { Receipt } from '@/domain/transaction/types'

export function formatReceiptText(receipt: Receipt): string {
  const fecha = new Date(receipt.createdAt).toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  return [
    'Comprobante — Spin Wallet',
    '',
    `Monto: ${formatMoney(receipt.amountCents)}`,
    `Para: ${receipt.recipient.name} (${receipt.recipient.handle})`,
    `ID de transacción: ${receipt.id}`,
    `Fecha: ${fecha}`,
    '',
    'Transacción exitosa.',
  ].join('\n')
}
