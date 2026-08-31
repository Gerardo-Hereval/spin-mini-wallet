export type Cents = number & { readonly __brand: 'Cents' }

export function fromCents(n: number): Cents {
  return Math.round(n) as Cents
}

export function toCents(input: string | number): Cents | null {
  const s = String(input).trim()
  if (s === '' || !/^\d+(\.\d+)?$/.test(s)) return null
  const value = Number(s)
  if (!Number.isFinite(value)) return null
  return Math.round(value * 100) as Cents
}

export function formatMoney(c: Cents, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(c / 100)
}
