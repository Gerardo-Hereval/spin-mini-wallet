'use client'
import { useState } from 'react'
import { formatReceiptText } from '@/lib/format/receipt'
import { renderReceiptImage } from '@/lib/format/receipt-image'
import type { Receipt } from '@/domain/transaction/types'

export type ShareStatus = 'idle' | 'sharing' | 'shared' | 'downloaded' | 'error'

/**
 * Shares the receipt as a PNG image. Uses the Web Share API with a file when
 * available (opens the OS share sheet → WhatsApp, email, etc.); otherwise
 * downloads the image as a fallback.
 */
export function useShareReceipt(receipt: Receipt) {
  const [status, setStatus] = useState<ShareStatus>('idle')

  async function share() {
    setStatus('sharing')
    try {
      const blob = await renderReceiptImage(receipt)
      const file = new File([blob], 'comprobante-spin.png', { type: 'image/png' })

      const nav = typeof navigator !== 'undefined' ? navigator : undefined
      if (nav?.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: 'Comprobante Spin Wallet', text: formatReceiptText(receipt) })
        setStatus('shared')
        return
      }

      // Fallback: download the image.
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'comprobante-spin.png'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setStatus('downloaded')
    } catch (err) {
      // The user dismissing the share sheet throws AbortError — not an error.
      if (err instanceof Error && err.name === 'AbortError') { setStatus('idle'); return }
      setStatus('error')
    }
  }

  return { share, status }
}
