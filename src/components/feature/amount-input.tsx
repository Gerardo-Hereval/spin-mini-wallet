'use client'
import { Input } from '@/components/ui/input'

export function AmountInput({ value, onChange, error }: {
  value: string; onChange: (v: string) => void; error?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm opacity-70" htmlFor="amount">Monto</label>
      <Input id="amount" inputMode="decimal" placeholder="0.00" value={value}
        onChange={(e) => onChange(e.target.value)} />
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
