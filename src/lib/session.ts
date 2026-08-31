import type { User } from '@/domain/session/types'

export const SESSION_COOKIE = 'session'

export function encodeSession(user: User): string {
  return Buffer.from(JSON.stringify(user), 'utf8').toString('base64url')
}

export function decodeSession(token: string | undefined): User | null {
  if (!token) return null
  try {
    const json = Buffer.from(token, 'base64url').toString('utf8')
    const parsed = JSON.parse(json) as Partial<User>
    if (typeof parsed.id === 'string' && typeof parsed.name === 'string') {
      return { id: parsed.id, name: parsed.name }
    }
    return null
  } catch {
    return null
  }
}

export function readSessionFromCookieHeader(header: string | null): User | null {
  if (!header) return null
  const prefix = `${SESSION_COOKIE}=`
  const entry = header.split(';').map((s) => s.trim()).find((s) => s.startsWith(prefix))
  if (!entry) return null
  return decodeSession(entry.slice(prefix.length))
}
