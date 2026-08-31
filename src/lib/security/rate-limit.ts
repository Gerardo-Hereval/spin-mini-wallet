const hits = new Map<string, number[]>()

export function checkRateLimit(
  key: string,
  opts: { limit?: number; windowMs?: number } = {},
): boolean {
  const limit = opts.limit ?? 5
  const windowMs = opts.windowMs ?? 60_000
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= limit) { hits.set(key, recent); return false }
  recent.push(now)
  hits.set(key, recent)
  return true
}
