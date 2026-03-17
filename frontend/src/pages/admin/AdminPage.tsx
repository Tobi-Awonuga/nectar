import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, UserX, UserCheck, Shield, UserPlus, Check, X } from 'lucide-react'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { adminService, type AdminUser, type AdminRole } from '@/services/admin.service'
import { onboardingService, type PendingOnboardingUser } from '@/services/onboarding.service'
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

function UserRoleCell({ userId, roles }: { userId: string; roles: AdminRole[] }) {
  const queryClient = useQueryClient()
  const userRolesQuery = useQuery({
    queryKey: ['user-roles', userId],
    queryFn: () => adminService.getUserRoles(userId),
  })
  const assignMutation = useMutation({
    mutationFn: (roleId: string) => adminService.assignRole(userId, roleId),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['user-roles', userId] }) },
  })
  const removeMutation = useMutation({
    mutationFn: (roleId: string) => adminService.removeRole(userId, roleId),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['user-roles', userId] }) },
  })

  const userRoles = userRolesQuery.data ?? []
  const unassignedRoles = roles.filter((r) => !userRoles.some((ur) => ur.id === r.id))

  return (
    <div className="flex flex-wrap items-center gap-1">
      {userRoles.map((role) => (
        <span key={role.id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
          {role.name}
          <button
            onClick={() => removeMutation.mutate(role.id)}
            className="ml-0.5 text-primary/60 hover:text-destructive"
            disabled={removeMutation.isPending}
          >
            ×
          </button>
        </span>
      ))}
      {unassignedRoles.length > 0 && (
        <select
          className="rounded border border-border bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground"
          value=""
          onChange={(e) => { if (e.target.value) assignMutation.mutate(e.target.value) }}
          disabled={assignMutation.isPending}
        >
          <option value="">+ Role</option>
          {unassignedRoles.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      )}
    </div>
  )
}

export default function AdminPage() {
  const queryClient = useQueryClient()

  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: adminService.getUsers,
  })

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: adminService.getRoles,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Pick<AdminUser, 'name' | 'isActive'>> }) =>
      adminService.updateUser(id, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const pendingQuery = useQuery({
    queryKey: ['pending-onboarding'],
    queryFn: onboardingService.getPending,
  })

  const approveMutation = useMutation({
    mutationFn: (userId: string) => onboardingService.approve(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pending-onboarding'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (userId: string) => onboardingService.reject(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pending-onboarding'] })
    },
  })

  const pendingUsers = pendingQuery.data ?? []

  const users = usersQuery.data ?? []
  const roles = rolesQuery.data ?? []
  const activeCount = users.filter((u) => u.isActive).length
  const inactiveCount = users.length - activeCount

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Admin</h2>
        <p className="mt-1 text-sm text-muted-foreground">Manage users and system access.</p>
      </div>

      {/* Pending access requests */}
      {pendingUsers.length > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <UserPlus size={15} className="text-warning" />
            <h3 className="text-sm font-semibold text-foreground">
              Pending Access Requests ({pendingUsers.length})
            </h3>
          </div>
          <div className="space-y-2">
            {pendingUsers.map((item) => {
              const isApproving = approveMutation.isPending && approveMutation.variables === item.user.id
              const isRejecting = rejectMutation.isPending && rejectMutation.variables === item.user.id
              return (
                <div
                  key={item.user.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-foreground">{item.user.name}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {item.user.email}
                      {item.user.department ? ` · ${item.user.department}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isApproving || isRejecting}
                      className="h-7 gap-1.5 px-3 text-xs border-destructive/30 text-destructive hover:bg-destructive/5"
                      onClick={() => rejectMutation.mutate(item.user.id)}
                    >
                      {isRejecting ? <LoadingSpinner className="h-3 w-3" /> : <X size={12} />}
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      disabled={isApproving || isRejecting}
                      className="h-7 gap-1.5 px-3 text-xs"
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
        </div>
      )}

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
            <div className="hidden w-40 md:block">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Role
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

                  {/* Role */}
                  <div className="hidden w-40 md:block">
                    <UserRoleCell userId={user.id} roles={roles} />
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
