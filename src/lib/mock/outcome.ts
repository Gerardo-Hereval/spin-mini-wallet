export const OUTCOME_NAMES = [
  'success', 'network_error', 'insufficient_funds', 'timeout', 'unknown_error',
] as const
export type OutcomeName = (typeof OUTCOME_NAMES)[number]

const WEIGHTED: OutcomeName[] = [
  'success', 'success', 'success', 'success', 'success', 'success',
  'network_error', 'insufficient_funds', 'timeout', 'unknown_error',
]

export function pickOutcome(forced?: string | null): OutcomeName {
  if (forced && (OUTCOME_NAMES as readonly string[]).includes(forced)) return forced as OutcomeName
  return WEIGHTED[Math.floor(Math.random() * WEIGHTED.length)]
}
