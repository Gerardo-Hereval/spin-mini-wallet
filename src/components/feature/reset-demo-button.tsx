'use client'
import { Button } from '@/components/ui/button'

export function ResetDemoButton({ onReset, isPending }: { onReset: () => void; isPending: boolean }) {
  return (
    <Button variant="ghost" size="sm" onClick={onReset} disabled={isPending} title="Reinicia datos, mocks y sesión">
      {isPending ? 'Reiniciando…' : 'Reiniciar demo'}
    </Button>
  )
}
