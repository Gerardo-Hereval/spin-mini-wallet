import type { Cents } from '@/domain/money/money'
export interface Movement {
  id: string; description: string; amountCents: Cents
  direction: 'in' | 'out'; createdAt: string
}
