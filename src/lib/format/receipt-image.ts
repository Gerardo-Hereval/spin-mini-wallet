import { formatMoney } from '@/domain/money/money'
import type { Receipt } from '@/domain/transaction/types'

/**
 * Renders a clean, self-contained receipt card to a PNG Blob using the Canvas
 * API (no dependencies). Client-only — relies on document/canvas.
 */
export async function renderReceiptImage(receipt: Receipt): Promise<Blob> {
  const scale = 2
  const w = 720
  const h = 460
  const canvas = document.createElement('canvas')
  canvas.width = w * scale
  canvas.height = h * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas_unavailable')
  ctx.scale(scale, scale)

  const font = (spec: string) => `${spec} system-ui, -apple-system, "Segoe UI", sans-serif`

  // Background + card
  ctx.fillStyle = '#0a0f1e'
  ctx.fillRect(0, 0, w, h)
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(24, 24, w - 48, h - 48, 20)
  else ctx.rect(24, 24, w - 48, h - 48)
  ctx.fillStyle = '#0e1626'
  ctx.fill()
  ctx.strokeStyle = 'rgba(56,189,248,0.30)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.textAlign = 'center'

  // Header
  ctx.fillStyle = '#38bdf8'
  ctx.font = font('bold 20px')
  ctx.fillText('SPIN WALLET', w / 2, 80)
  ctx.fillStyle = '#e6eef8'
  ctx.font = font('600 18px')
  ctx.fillText('¡Transacción exitosa!', w / 2, 118)

  // Amount
  ctx.fillStyle = '#ffffff'
  ctx.font = font('bold 54px')
  ctx.fillText(formatMoney(receipt.amountCents), w / 2, 202)

  // Recipient
  ctx.fillStyle = '#9fb3c8'
  ctx.font = font('18px')
  ctx.fillText(`Para ${receipt.recipient.name}`, w / 2, 250)
  ctx.fillStyle = '#7b8ca0'
  ctx.font = font('15px')
  ctx.fillText(receipt.recipient.handle, w / 2, 278)

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.beginPath()
  ctx.moveTo(80, 322)
  ctx.lineTo(w - 80, 322)
  ctx.stroke()

  // ID (left) + date (right)
  ctx.fillStyle = '#8598ab'
  ctx.font = font('14px')
  ctx.textAlign = 'left'
  ctx.fillText(`ID: ${receipt.id}`, 80, 356)
  const fecha = new Date(receipt.createdAt).toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  ctx.textAlign = 'right'
  ctx.fillText(fecha, w - 80, 356)

  // Footer
  ctx.textAlign = 'center'
  ctx.fillStyle = '#5b6b7d'
  ctx.font = font('13px')
  ctx.fillText('Comprobante generado por Spin Wallet', w / 2, h - 44)

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('blob_failed'))), 'image/png')
  })
}
