import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NectarLogo } from '@/components/brand/NectarLogo'
import { useAuthContext } from '../../context/AuthContext'

export default function LoginPage() {
  const { login, devLogin, isAuthenticated } = useAuthContext()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (isAuthenticated) {
    navigate('/', { replace: true })
    return null
  }

  async function handleLogin() {
    setIsLoading(true)
    setError(null)
    try {
      await login()
      navigate('/', { replace: true })
    } catch {
      setError('Sign in failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDevLogin(role: string) {
    setIsLoading(true)
    setError(null)
    try {
      await devLogin(role)
      navigate('/', { replace: true })
    } catch {
      setError('Dev login failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Left — brand panel */}
      <div className="hidden lg:flex lg:w-[55%] flex-col justify-between bg-sidebar px-14 py-12 relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

        {/* Logo */}
        <NectarLogo size="md" className="relative z-10" wordmarkClassName="text-white" />

        {/* Main copy */}
        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white">
              Operational workflows,<br />
              <span className="text-primary/80">streamlined.</span>
            </h1>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-sidebar-foreground/70">
              Nectar connects every department through structured, traceable workflows — from procurement to compliance.
            </p>
          </div>

          {/* Feature bullets */}
          <div className="space-y-3">
            {[
              'End-to-end request tracking',
              'Role-based approvals and audit trail',
              'Built for CT Bakery operations',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-[13px] text-sidebar-foreground/60">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-[12px] text-sidebar-foreground/30">
            © {new Date().getFullYear()} CT Bakery Operations
          </p>
        </div>
      </div>

      {/* Right — sign-in panel */}
      <div className="flex w-full flex-col items-center justify-center bg-background px-8 lg:w-[45%]">
        {/* Mobile logo */}
        <NectarLogo size="sm" className="mb-8 lg:hidden" />

        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h2>
            <p className="text-sm text-muted-foreground">
              Sign in with your CT Bakery Microsoft account to continue.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-[14px] font-medium text-foreground shadow-sm transition-all hover:bg-accent hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
            >
              {/* Microsoft logo */}
              <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
                <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
              </svg>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Signing in…
                </span>
              ) : (
                'Continue with Microsoft'
              )}
            </button>

            {error && (
              <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-center text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          <p className="text-center text-[12px] text-muted-foreground/60">
            Access is restricted to CT Bakery employees.
          </p>

          {import.meta.env.DEV && (
            <div className="space-y-2 rounded-xl border border-dashed border-border bg-muted/40 p-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Dev login
              </p>
              <div className="flex gap-2">
                {['Admin', 'Manager', 'Employee'].map((role) => (
                  <button
                    key={role}
                    onClick={() => handleDevLogin(role)}
                    disabled={isLoading}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
