'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Props {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  isPending: boolean
  error: string | null
}
export function LoginForm({ value, onChange, onSubmit, isPending, error }: Props) {
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit() }}
      className="mx-auto flex w-full max-w-sm flex-col gap-4"
    >
      <Input
        aria-label="Email o teléfono"
        placeholder="Email o teléfono"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Ingresando…' : 'Ingresar'}
      </Button>
    </form>
  )
}
