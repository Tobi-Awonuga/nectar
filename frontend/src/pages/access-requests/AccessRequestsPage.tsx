import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UserPlus, Building2, Check, X, Clock } from 'lucide-react'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { onboardingService } from '@/services/onboarding.service'

function formatRelativeDate(iso: string) {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function UserInitials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/)
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase()
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[13px] font-semibold text-primary">
      {initials}
    </div>
  )
}

export default function AccessRequestsPage() {
  const queryClient = useQueryClient()

  const pendingQuery = useQuery({
    queryKey: ['pending-onboarding'],
    queryFn: onboardingService.getPending,
  })

  const approveMutation = useMutation({
    mutationFn: (userId: string) => onboardingService.approve(userId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['pending-onboarding'] }),
  })

  const rejectMutation = useMutation({
    mutationFn: (userId: string) => onboardingService.reject(userId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['pending-onboarding'] }),
  })

  const pending = pendingQuery.data ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UserPlus size={22} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl font-semibold text-foreground">Access Requests</h2>
              {pending.length > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-warning/20 px-1.5 text-[11px] font-bold text-warning">
                  {pending.length}
                </span>
              )}
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              New users who have submitted their details and are waiting for approval to access Nectar.
              Admins see all requests; managers see requests for their department only.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      {pendingQuery.isLoading ? (
        <div className="flex min-h-[260px] items-center justify-center">
          <LoadingSpinner className="h-7 w-7" />
        </div>
      ) : pendingQuery.isError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-8 text-center">
          <p className="text-sm font-medium text-destructive">Unable to load access requests</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => void pendingQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : pending.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground/40">
            <UserPlus size={22} />
          </div>
          <p className="mt-3 text-sm font-semibold text-foreground">No pending requests</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            All access requests have been reviewed.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm shadow-black/[0.03] overflow-hidden">
          <div className="divide-y divide-border">
            {pending.map((item) => {
              const isApproving = approveMutation.isPending && approveMutation.variables === item.user.id
              const isRejecting = rejectMutation.isPending && rejectMutation.variables === item.user.id
              const isBusy = isApproving || isRejecting

              return (
                <div key={item.user.id} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/20">
                  {/* Avatar + info */}
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <UserInitials name={item.user.name} />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-foreground">{item.user.name}</p>
                      <p className="truncate text-[12px] text-muted-foreground">{item.user.email}</p>
                      {item.user.department && (
                        <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Building2 size={10} />
                          {item.user.department}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Requested at */}
                  <div className="hidden shrink-0 items-center gap-1.5 text-[12px] text-muted-foreground sm:flex">
                    <Clock size={12} />
                    {formatRelativeDate(item.requestedAt)}
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm" variant="outline" disabled={isBusy}
                      className="h-8 gap-1.5 px-3 text-xs border-destructive/30 text-destructive hover:bg-destructive/5 hover:border-destructive/50"
                      onClick={() => rejectMutation.mutate(item.user.id)}
                    >
                      {isRejecting ? <LoadingSpinner className="h-3 w-3" /> : <X size={12} />}
                      Reject
                    </Button>
                    <Button
                      size="sm" disabled={isBusy}
                      className="h-8 gap-1.5 px-3 text-xs"
                      onClick={() => approveMutation.mutate(item.user.id)}
                    >
                      {isApproving ? <LoadingSpinner className="h-3 w-3" /> : <Check size={12} />}
                      Approve
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="border-t border-border bg-muted/20 px-5 py-3">
            <p className="text-[12px] text-muted-foreground">
              {pending.length} pending {pending.length === 1 ? 'request' : 'requests'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
