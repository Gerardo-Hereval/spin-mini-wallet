import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, decodeSession } from '@/lib/session'

export function proxy(req: NextRequest) {
  const user = decodeSession(req.cookies.get(SESSION_COOKIE)?.value)
  if (!user) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = { matcher: ['/home/:path*', '/transfer/:path*'] }
