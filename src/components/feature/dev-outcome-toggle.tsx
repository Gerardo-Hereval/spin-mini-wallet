'use client'
import { useDevStore } from '@/stores/dev-store'

const OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Aleatorio (default)' },
  { value: 'success', label: 'Éxito' },
  { value: 'network_error', label: 'Error de red' },
  { value: 'insufficient_funds', label: 'Fondos insuficientes' },
  { value: 'timeout', label: 'Timeout (9–12s)' },
  { value: 'unknown_error', label: 'Error desconocido' },
]

/**
 * Floating dev-only control to force the next transaction's outcome.
 * Renders nothing in production.
 */
export function DevOutcomeToggle() {
  const forced = useDevStore((s) => s.forcedOutcome)
  const setForced = useDevStore((s) => s.setForcedOutcome)

  if (process.env.NODE_ENV === 'production') return null

  return (
    <div className="fixed right-3 bottom-3 z-50 flex flex-col gap-1 rounded-lg border border-amber-500/40 bg-background/90 p-2 text-xs shadow-lg backdrop-blur">
      <label htmlFor="dev-outcome" className="font-semibold text-amber-400">
        DEV · forzar desenlace
      </label>
      <select
        id="dev-outcome"
        aria-label="Forzar desenlace de la transacción (dev)"
        className="rounded border border-border bg-background p-1"
        value={forced ?? ''}
        onChange={(e) => setForced(e.target.value || null)}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
