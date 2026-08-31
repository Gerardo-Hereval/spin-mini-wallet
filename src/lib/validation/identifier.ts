const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const PHONE_CHARS_RE = /^[+\d\s()-]+$/
const MAX_PHONE_DIGITS = 10
const MIN_PHONE_DIGITS = 7

export function isValidPhone(value: string): boolean {
  const v = value.trim()
  if (!PHONE_CHARS_RE.test(v)) return false
  const digits = v.replace(/\D/g, '')
  return digits.length >= MIN_PHONE_DIGITS && digits.length <= MAX_PHONE_DIGITS
}

export function isEmailOrPhone(value: string): boolean {
  const v = value.trim()
  return EMAIL_RE.test(v) || isValidPhone(v)
}

export const MIN_PASSWORD_LENGTH = 6

export function isValidPassword(value: string): boolean {
  return value.length >= MIN_PASSWORD_LENGTH
}
