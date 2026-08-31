'use client'
import { useState } from 'react'
import { formatReceiptText } from '@/lib/format/receipt'
import type { Receipt } from '@/domain/transaction/types'

export type ShareStatus = 'idle' | 'shared' | 'copied' | 'error'

/**
 * Shares a receipt as plain text. Uses the Web Share API when available
 * (opens the OS share sheet → WhatsApp, email, etc.); otherwise falls back
 * to copying the text to the clipboard.
 */
export function useShareReceipt(receipt: Receipt) {
  const [status, setStatus] = useState<ShareStatus>('idle')

  async function share() {
    const text = formatReceiptText(receipt)
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title: 'Comprobante Spin Wallet', text })
        setStatus('shared')
        return
      }
      await navigator.clipboard.writeText(text)
      setStatus('copied')
    } catch (err) {
      // The user dismissing the share sheet throws AbortError — not an error.
      if (err instanceof Error && err.name === 'AbortError') { setStatus('idle'); return }
      try {
        await navigator.clipboard.writeText(text)
        setStatus('copied')
      } catch {
        setStatus('error')
      }
    }
  }

  return { share, status }
}
