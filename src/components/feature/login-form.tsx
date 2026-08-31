'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Field = 'identifier' | 'password'

interface Props {
  identifier: string
  password: string
  onIdentifierChange: (v: string) => void
  onPasswordChange: (v: string) => void
  onBlur: (field: Field) => void
  errors: { identifier?: string; password?: string }
  formError: string | null
  canSubmit: boolean
  isPending: boolean
  onSubmit: () => void
}

export function LoginForm({
  identifier,
  password,
  onIdentifierChange,
  onPasswordChange,
  onBlur,
  errors,
  formError,
  canSubmit,
  isPending,
  onSubmit,
}: Props) {
  const [show, setShow] = useState(false)

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit() }}
      className="mx-auto flex w-full max-w-sm flex-col gap-4"
      noValidate
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="identifier" className="text-sm opacity-70">Email o teléfono</label>
        <Input
          id="identifier"
          aria-label="Email o teléfono"
          aria-invalid={!!errors.identifier}
          placeholder="tu@email.com"
          value={identifier}
          onChange={(e) => onIdentifierChange(e.target.value)}
          onBlur={() => onBlur('identifier')}
        />
        {errors.identifier && <p role="alert" className="text-sm text-destructive">{errors.identifier}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm opacity-70">Contraseña</label>
        <div className="relative">
          <Input
            id="password"
            type={show ? 'text' : 'password'}
            aria-label="Contraseña"
            aria-invalid={!!errors.password}
            placeholder="Mínimo 6 caracteres"
            className="pr-16"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            onBlur={() => onBlur('password')}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute inset-y-0 right-2 my-auto h-fit text-xs font-medium text-primary hover:underline"
          >
            {show ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        {errors.password && <p role="alert" className="text-sm text-destructive">{errors.password}</p>}
      </div>

      {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" disabled={!canSubmit}>
        {isPending ? 'Ingresando…' : 'Ingresar'}
      </Button>
    </form>
  )
}
