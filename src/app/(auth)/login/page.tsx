'use client'
import { useState } from 'react'
import { LoginForm } from '@/components/feature/login-form'
import { useLogin } from '@/hooks/use-login'
import { ResetDemoControl } from '@/components/feature/reset-demo-control'

export default function LoginPage() {
  const [value, setValue] = useState('')
  const { submit, isPending, error } = useLogin()
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full">
        <h1 className="mb-6 text-center text-2xl font-semibold">Spin Wallet</h1>
        <LoginForm value={value} onChange={setValue} onSubmit={() => submit(value)} isPending={isPending} error={error} />
        <div className="mt-6 text-center"><ResetDemoControl /></div>
      </div>
    </main>
  )
}
