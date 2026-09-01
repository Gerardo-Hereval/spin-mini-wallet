import { NextResponse } from 'next/server'
import { loginSchema } from '@/lib/validation/schemas'
import { store } from '@/lib/db/store'
import { SESSION_COOKIE, encodeSession } from '@/lib/session'
import { randomDelay } from '@/lib/mock/latency'
import { checkRateLimit } from '@/lib/security/rate-limit'

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'local'
  if (!checkRateLimit(`login:${ip}`)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }
  const body = await req.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 422 })
  }
  await randomDelay(400, 900)
  const user = store.getUser()
  const res = NextResponse.json({ user })
  res.cookies.set(SESSION_COOKIE, encodeSession(user), {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/',
  })
  return res
}
