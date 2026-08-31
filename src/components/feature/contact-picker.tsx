'use client'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { initials } from '@/lib/format/initials'
import { isEmailOrPhone } from '@/lib/validation/identifier'
import type { Contact } from '@/domain/contact/types'

export function ContactPicker({ contacts, selectedId, onSelect, onCreate }: {
  contacts: Contact[]
  selectedId: string | null
  onSelect: (c: Contact) => void
  onCreate: (name: string, handle: string) => void
}) {
  const [query, setQuery] = useState('')
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [touched, setTouched] = useState<{ name: boolean; handle: boolean }>({ name: false, handle: false })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return contacts
    return contacts.filter((c) =>
      c.name.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q),
    )
  }, [contacts, query])

  const nameValid = name.trim().length > 0
  const handleValid = isEmailOrPhone(handle)
  const nameError = touched.name && !nameValid ? 'Ingresa un nombre' : undefined
  const handleError = touched.handle && !handleValid ? 'Email o teléfono no válido' : undefined

  function create() {
    setTouched({ name: true, handle: true })
    if (!nameValid || !handleValid) return
    onCreate(name.trim(), handle.trim())
    setName(''); setHandle(''); setTouched({ name: false, handle: false })
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        aria-label="Buscar contacto"
        placeholder="Buscar contacto…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <ul className="flex flex-col gap-2" data-testid="contact-list">
        {filtered.length === 0 && (
          <li className="py-2 text-sm opacity-60">Sin coincidencias.</li>
        )}
        {filtered.map((c) => {
          const selected = selectedId === c.id
          return (
            <li key={c.id}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(c)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors',
                  selected
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-muted',
                )}
              >
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary"
                >
                  {initials(c.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{c.name}</span>
                  <span className="block truncate text-sm opacity-60">{c.handle}</span>
                </span>
                {selected && (
                  <span aria-hidden className="text-primary" title="Seleccionado">✓</span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      <div className="flex flex-col gap-2 border-t pt-4">
        <p className="text-sm font-medium opacity-80">Nuevo contacto</p>
        <div className="flex flex-col gap-1">
          <Input
            aria-label="Nombre del contacto"
            aria-invalid={!!nameError}
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          />
          {nameError && <p role="alert" className="text-sm text-destructive">{nameError}</p>}
        </div>
        <div className="flex flex-col gap-1">
          <Input
            aria-label="Email o teléfono del contacto"
            aria-invalid={!!handleError}
            placeholder="Email o teléfono"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, handle: true }))}
          />
          {handleError && <p role="alert" className="text-sm text-destructive">{handleError}</p>}
        </div>
        <Button type="button" variant="outline" disabled={!nameValid || !handleValid} onClick={create}>
          Guardar y seleccionar
        </Button>
      </div>
    </div>
  )
}
