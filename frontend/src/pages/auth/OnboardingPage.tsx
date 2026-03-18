import { useState } from 'react'
import { useAuthContext } from '../../context/AuthContext'
import { onboardingService } from '../../services/onboarding.service'
import { NectarLogo } from '@/components/brand/NectarLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const DEPARTMENTS = [
  'Production',
  'Shipping / Receiving',
  'Finished Goods',
  'Logistics',
  'Regulatory',
  'ERP / Systems',
  'Warehouse',
  'Inventory Control',
  'QA',
  'Finance',
  'Plant Leadership',
  'Analytics',
  'Human Resources',
]

export default function OnboardingPage() {
  const { user, refreshUser } = useAuthContext()

  // Pre-fill name from SSO
  const nameParts = (user?.name ?? '').trim().split(' ')
  const [firstName, setFirstName] = useState(nameParts[0] ?? '')
  const [lastName, setLastName] = useState(nameParts.slice(1).join(' '))
  const [department, setDepartment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !department) {
      setError('Please fill in all fields and select a department.')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      await onboardingService.submit({ firstName, lastName, department })
      await refreshUser()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <NectarLogo size="sm" />

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome to Nectar</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Tell us a bit about yourself to request access. An administrator will review and approve your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-foreground">First name</label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-foreground">Last name</label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="h-10"
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">Email</label>
            <Input value={user?.email ?? ''} readOnly disabled className="h-10 opacity-60" />
          </div>

          {/* Department */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-foreground">Department</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setDepartment(dept)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-left text-[12px] font-medium transition-all',
                    department === dept
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  )}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || !firstName || !lastName || !department}
            className="w-full"
          >
            {isSubmitting ? 'Submitting…' : 'Request Access'}
          </Button>
        </form>
      </div>
    </div>
  )
}
