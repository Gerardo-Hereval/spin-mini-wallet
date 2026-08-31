// Pure, framework-free validators reused by client forms and server (zod) schemas.
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// A phone may contain digits and common separators (spaces, +, -, parentheses),
// and must have between MIN and MAX actual digits — 10 digits maximum.
const PHONE_CHARS_RE = /^[+\d\s()-]+$/
export const MAX_PHONE_DIGITS = 10
const MIN_PHONE_DIGITS = 7

export function isValidPhone(value: string): boolean {
  const v = value.trim()
  if (!PHONE_CHARS_RE.test(v)) return false
  const digits = v.replace(/\D/g, '')
  return digits.length >= MIN_PHONE_DIGITS && digits.length <= MAX_PHONE_DIGITS
}

/** True when the value looks like an email OR a valid (≤10-digit) phone number. */
export function isEmailOrPhone(value: string): boolean {
  const v = value.trim()
  return EMAIL_RE.test(v) || isValidPhone(v)
}

export const MIN_PASSWORD_LENGTH = 6

/** True when the (mock) password meets the minimum length. */
export function isValidPassword(value: string): boolean {
  return value.length >= MIN_PASSWORD_LENGTH
}
