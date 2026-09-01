import { NextResponse } from 'next/server'
import { store } from '@/lib/db/store'
import { SESSION_COOKIE } from '@/lib/session'

export async function POST() {
  if (process.env.ALLOW_DEMO_RESET === 'false') {
    return NextResponse.json({ error: 'disabled' }, { status: 403 })
  }
  store.reset()
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(SESSION_COOKIE)
  return res
}
