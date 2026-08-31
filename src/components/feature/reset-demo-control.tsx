'use client'
import { ResetDemoButton } from './reset-demo-button'
import { useResetDemo } from '@/hooks/use-reset-demo'

export function ResetDemoControl() {
  const { reset, isPending } = useResetDemo()
  return <ResetDemoButton onReset={reset} isPending={isPending} />
}
