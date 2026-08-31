'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Contact } from '@/domain/contact/types'

export function ContactPicker({ contacts, selectedId, onSelect, onCreate }: {
  contacts: Contact[]
  selectedId: string | null
  onSelect: (c: Contact) => void
  onCreate: (name: string, handle: string) => void
}) {
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2" data-testid="contact-list">
        {contacts.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              aria-pressed={selectedId === c.id}
              onClick={() => onSelect(c)}
              className={`w-full rounded border p-2 text-left ${selectedId === c.id ? 'border-cyan-400' : ''}`}
            >
              {c.name} <span className="opacity-60">{c.handle}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2 border-t pt-3">
        <p className="text-sm opacity-70">Nuevo contacto</p>
        <Input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Email o teléfono" value={handle} onChange={(e) => setHandle(e.target.value)} />
        <Button type="button" variant="outline"
          disabled={!name.trim() || !handle.trim()}
          onClick={() => onCreate(name.trim(), handle.trim())}>
          Guardar y seleccionar
        </Button>
      </div>
    </div>
  )
}
