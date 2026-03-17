import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, UserX, UserCheck, Shield } from 'lucide-react'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { adminService, type AdminUser } from '@/services/admin.service'
import { cn } from '@/lib/utils'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function UserInitials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/)
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase()
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[13px] font-semibold text-primary">
      {initials}
    </div>
  )
}

function StatPill({
  icon: Icon,
  label,
  value,
  colorClass,
}: {
  icon: React.ElementType
  label: string
  value: number
  colorClass: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm shadow-black/[0.03]">
      <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', colorClass)}>
        <Icon size={15} className="shrink-0" />
      </div>
      <div>
        <p className="text-lg font-bold tabular-nums text-foreground leading-none">{value}</p>
        <p className="mt-0.5 text-[12px] text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const queryClient = useQueryClient()

  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: adminService.getUsers,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Pick<AdminUser, 'name' | 'isActive'>> }) =>
      adminService.updateUser(id, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const users = usersQuery.data ?? []
  const activeCount = users.filter((u) => u.isActive).length
  const inactiveCount = users.length - activeCount

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Admin</h2>
        <p className="mt-1 text-sm text-muted-foreground">Manage users and system access.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatPill
          icon={Users}
          label="Total Users"
          value={users.length}
          colorClass="bg-primary/10 text-primary"
        />
        <StatPill
          icon={UserCheck}
          label="Active"
          value={activeCount}
          colorClass="bg-green-100 text-green-700"
        />
        <StatPill
          icon={UserX}
          label="Inactive"
          value={inactiveCount}
          colorClass="bg-slate-100 text-slate-600"
        />
      </div>

      {/* Content */}
      {usersQuery.isLoading ? (
        <div className="flex min-h-[260px] items-center justify-center">
          <LoadingSpinner className="h-7 w-7" />
        </div>
      ) : usersQuery.isError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-8 text-center">
          <p className="text-sm font-medium text-destructive">Unable to load users</p>
          <p className="mt-1 text-xs text-muted-foreground">Check your connection and try again.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => void usersQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-16 text-center shadow-sm shadow-black/[0.03]">
          <Users size={32} className="mx-auto text-muted-foreground/30" />
          <p className="mt-3 text-sm font-semibold text-foreground">No users found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Users will appear here once accounts are created.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm shadow-black/[0.03] overflow-hidden">
          {/* Table header */}
          <div className="flex items-center gap-4 border-b border-border bg-muted/30 px-5 py-3">
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                User
              </span>
            </div>
            <div className="hidden w-24 sm:block">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </span>
            </div>
            <div className="hidden w-28 md:block">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Joined
              </span>
            </div>
            <div className="w-28 text-right">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Action
              </span>
            </div>
          </div>

          {/* User rows */}
          <div className="divide-y divide-border">
            {users.map((user) => {
              const isMutating =
                updateMutation.isPending && updateMutation.variables?.id === user.id

              return (
                <div
                  key={user.id}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/20"
                >
                  {/* Avatar + name/email */}
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <UserInitials name={user.name} />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-foreground">
                        {user.name}
                      </p>
                      <p className="truncate text-[12px] text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="hidden w-24 sm:block">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                        user.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          user.isActive ? 'bg-green-500' : 'bg-slate-400'
                        )}
                      />
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Joined date */}
                  <div className="hidden w-28 md:block">
                    <span className="text-[12px] text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </span>
                  </div>

                  {/* Action button */}
                  <div className="w-28 text-right">
                    {user.isActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isMutating}
                        className="h-7 px-3 text-xs text-destructive hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive"
                        onClick={() =>
                          updateMutation.mutate({ id: user.id, patch: { isActive: false } })
                        }
                      >
                        {isMutating ? (
                          <LoadingSpinner className="h-3 w-3" />
                        ) : (
                          <UserX size={12} />
                        )}
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isMutating}
                        className="h-7 px-3 text-xs"
                        onClick={() =>
                          updateMutation.mutate({ id: user.id, patch: { isActive: true } })
                        }
                      >
                        {isMutating ? (
                          <LoadingSpinner className="h-3 w-3" />
                        ) : (
                          <UserCheck size={12} />
                        )}
                        Activate
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="border-t border-border bg-muted/20 px-5 py-3">
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <Shield size={12} />
              <span>
                {users.length} {users.length === 1 ? 'user' : 'users'} total · {activeCount} active
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
