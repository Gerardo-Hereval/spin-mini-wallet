import { NextResponse } from 'next/server'
import { store } from '@/lib/mock/store'
import { contactSchema } from '@/lib/validation/schemas'

export async function GET() {
  return NextResponse.json({ contacts: store.listContacts() })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 422 })
  const contact = store.addContact(parsed.data.name, parsed.data.handle)
  return NextResponse.json({ contact }, { status: 201 })
}
