// Pure, framework-free validators reused by client forms and server (zod) schemas.
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const PHONE_RE = /^\+?[\d\s()-]{7,}$/

/** True when the value looks like an email OR a phone number. */
export function isEmailOrPhone(value: string): boolean {
  const v = value.trim()
  return EMAIL_RE.test(v) || PHONE_RE.test(v)
}

export const MIN_PASSWORD_LENGTH = 6

/** True when the (mock) password meets the minimum length. */
export function isValidPassword(value: string): boolean {
  return value.length >= MIN_PASSWORD_LENGTH
}
