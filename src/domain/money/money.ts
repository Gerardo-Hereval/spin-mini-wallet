export type Cents = number & { readonly __brand: 'Cents' }

export function fromCents(n: number): Cents {
  return Math.round(n) as Cents
}

export function toCents(input: string | number): Cents | null {
  const s = String(input).trim()
  if (s === '' || !/^\d+(\.\d+)?$/.test(s)) return null

  const [intPart, fracPart = ''] = s.split('.')

  const intCents = Number(intPart) * 100

  const padded = (fracPart + '000').slice(0, 3)
  const fracCents = Number(padded.slice(0, 2))
  const roundDigit = Number(padded[2])

  const totalCents = intCents + fracCents + (roundDigit >= 5 ? 1 : 0)

  return totalCents as Cents
}

export function formatMoney(c: Cents, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(c / 100)
}
