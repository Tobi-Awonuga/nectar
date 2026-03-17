import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'

export default function LoginPage() {
  const { login, isAuthenticated } = useAuthContext()
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

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Left — brand panel */}
      <div className="hidden lg:flex lg:w-[55%] flex-col justify-between bg-sidebar px-14 py-12 relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30">
            <span className="text-sm font-bold text-white">N</span>
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">Nectar</span>
        </div>

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
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-xs font-bold text-white">N</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">Nectar</span>
        </div>

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
        </div>
      </div>
    </div>
  )
}
