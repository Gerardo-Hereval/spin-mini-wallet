'use client'
import { LoginForm } from '@/components/feature/login-form'
import { useLogin } from '@/hooks/use-login'
import { ResetDemoControl } from '@/components/feature/reset-demo-control'

export default function LoginPage() {
  const login = useLogin()
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full">
        <h1 className="mb-2 text-center text-3xl font-bold tracking-tight">Spin Wallet</h1>
        <p className="mb-8 text-center text-sm opacity-60">Envía dinero de forma simple y segura.</p>
        <LoginForm
          identifier={login.identifier}
          password={login.password}
          onIdentifierChange={login.setIdentifier}
          onPasswordChange={login.setPassword}
          onBlur={login.touch}
          errors={login.errors}
          formError={login.formError}
          canSubmit={login.canSubmit}
          isPending={login.isPending}
          onSubmit={login.submit}
        />
        <div className="mt-6 text-center"><ResetDemoControl /></div>
      </div>
    </main>
  )
}
