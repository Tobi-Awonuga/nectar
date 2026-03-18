import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  UserX,
  UserCheck,
  Shield,
  UserPlus,
  ChevronDown,
  X,
  ArrowRight,
  Route,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { adminService, type AdminRole, type AdminUser } from '@/services/admin.service'
import { onboardingService } from '@/services/onboarding.service'
import { workflowDepartments } from '@/config/workflowBlueprints'
import { cn } from '@/lib/utils'

const DEPARTMENTS = workflowDepartments.filter((department) => department !== 'All Departments')

const roleConfig: Record<
  string,
  {
    label: string
    description: string
    pill: string
  }
> = {
  Admin: {
    label: 'Admin',
    description: 'Full platform access',
    pill: 'bg-violet-100 text-violet-700 border-violet-200',
  },
  Manager: {
    label: 'Manager',
    description: 'Approve requests, manage workflows',
    pill: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  Employee: {
    label: 'Employee',
    description: 'Create and view own requests',
    pill: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
}

function getRoleConfig(name: string) {
  return (
    roleConfig[name] ?? {
      label: name,
      description: '',
      pill: 'bg-muted text-muted-foreground border-border',
    }
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
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
        <p className="text-lg font-bold leading-none tabular-nums text-foreground">{value}</p>
        <p className="mt-0.5 text-[12px] text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

function UserDeptCell({ userId, currentDept }: { userId: string; currentDept: string | null }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const updateMutation = useMutation({
    mutationFn: (department: string) => adminService.updateUser(userId, { department }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setOpen(false)
    },
  })

  return (
    <div className="relative mt-0.5">
      <button
        onClick={() => setOpen((previous) => !previous)}
        className={cn(
          'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors',
          currentDept
            ? 'border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-foreground'
            : 'border-dashed border-border text-muted-foreground/60 hover:border-primary/40 hover:text-muted-foreground',
        )}
      >
        {currentDept ?? 'Set dept'}
        <ChevronDown size={9} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-52 overflow-hidden rounded-xl border border-border bg-popover shadow-lg shadow-black/5">
          <div className="max-h-56 overflow-y-auto">
            {DEPARTMENTS.map((department) => (
              <button
                key={department}
                onClick={() => updateMutation.mutate(department)}
                disabled={updateMutation.isPending}
                className={cn(
                  'flex w-full items-center px-3 py-2 text-left text-[12px] transition-colors hover:bg-accent',
                  department === currentDept && 'font-semibold text-primary',
                )}
              >
                {department}
                {department === currentDept && (
                  <span className="ml-auto text-[10px] text-primary/50">current</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function UserRoleCell({ userId, allRoles }: { userId: string; allRoles: AdminRole[] }) {
  const queryClient = useQueryClient()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const userRolesQuery = useQuery({
    queryKey: ['user-roles', userId],
    queryFn: () => adminService.getUserRoles(userId),
  })

  const assignMutation = useMutation({
    mutationFn: (roleId: string) => adminService.assignRole(userId, roleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user-roles', userId] })
      setDropdownOpen(false)
    },
  })

  const removeMutation = useMutation({
    mutationFn: (roleId: string) => adminService.removeRole(userId, roleId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['user-roles', userId] }),
  })

  const userRoles = userRolesQuery.data ?? []
  const unassignedRoles = allRoles.filter((role) => !userRoles.some((userRole) => userRole.id === role.id))

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {userRoles.map((role) => {
        const config = getRoleConfig(role.name)
        return (
          <span
            key={role.id}
            className={cn(
              'group inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold',
              config.pill,
            )}
          >
            {config.label}
            <button
              onClick={() => removeMutation.mutate(role.id)}
              disabled={removeMutation.isPending}
              className="opacity-40 transition-opacity hover:opacity-100"
              title={`Remove ${role.name} role`}
            >
              <X size={10} />
            </button>
          </span>
        )
      })}

      {unassignedRoles.length > 0 && (
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen((previous) => !previous)}
            className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            Add role
            <ChevronDown size={10} className={cn('transition-transform', dropdownOpen && 'rotate-180')} />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-xl border border-border bg-popover shadow-lg shadow-black/5">
              {unassignedRoles.map((role) => {
                const config = getRoleConfig(role.name)
                return (
                  <button
                    key={role.id}
                    onClick={() => assignMutation.mutate(role.id)}
                    disabled={assignMutation.isPending}
                    className="flex w-full flex-col px-3 py-2.5 text-left transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-accent"
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn('rounded-md border px-1.5 py-0.5 text-[10px] font-semibold', config.pill)}>
                        {config.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{config.description}</p>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {userRolesQuery.isLoading && <LoadingSpinner className="h-3 w-3" />}
    </div>
  )
}

export default function AdminPage() {
  const queryClient = useQueryClient()

  const usersQuery = useQuery({ queryKey: ['admin-users'], queryFn: adminService.getUsers })
  const rolesQuery = useQuery({ queryKey: ['roles'], queryFn: adminService.getRoles })
  const pendingQuery = useQuery({ queryKey: ['pending-onboarding'], queryFn: onboardingService.getPending })
  const defaultsQuery = useQuery({
    queryKey: ['department-defaults'],
    queryFn: adminService.getDepartmentDefaults,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Pick<AdminUser, 'name' | 'isActive'>> }) =>
      adminService.updateUser(id, patch),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const defaultMutation = useMutation({
    mutationFn: ({ department, userId }: { department: string; userId: string }) =>
      adminService.setDepartmentDefault(department, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['department-defaults'] })
      void queryClient.invalidateQueries({ queryKey: ['user-directory'] })
    },
  })

  const users = usersQuery.data ?? []
  const allRoles = rolesQuery.data ?? []
  const defaultAssignees = defaultsQuery.data ?? []
  const pendingCount = (pendingQuery.data ?? []).length
  const activeCount = users.filter((user) => user.isActive).length
  const inactiveCount = users.length - activeCount

  const usersByDepartment = DEPARTMENTS.reduce<Record<string, AdminUser[]>>((accumulator, department) => {
    accumulator[department] = users.filter((user) => user.department === department && user.isActive)
    return accumulator
  }, {})

  const defaultByDepartment = new Map(defaultAssignees.map((entry) => [entry.department, entry]))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Admin</h2>
        <p className="mt-1 text-sm text-muted-foreground">Manage users, roles, system access, and request routing defaults.</p>
      </div>

      {pendingCount > 0 && (
        <Link
          to="/access-requests"
          className="flex items-center justify-between rounded-xl border border-warning/30 bg-warning/5 px-5 py-4 no-underline transition-colors hover:bg-warning/10"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/15 text-warning">
              <UserPlus size={15} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-foreground">
                {pendingCount} pending access {pendingCount === 1 ? 'request' : 'requests'}
              </p>
              <p className="text-[12px] text-muted-foreground">Review and approve new user applications</p>
            </div>
          </div>
          <ArrowRight size={15} className="shrink-0 text-muted-foreground" />
        </Link>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatPill icon={Users} label="Total Users" value={users.length} colorClass="bg-primary/10 text-primary" />
        <StatPill icon={UserCheck} label="Active" value={activeCount} colorClass="bg-green-100 text-green-700" />
        <StatPill icon={UserX} label="Inactive" value={inactiveCount} colorClass="bg-slate-100 text-slate-600" />
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm shadow-black/[0.03]">
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Route size={15} className="text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Department Default Assignees</h3>
          </div>
          <p className="mt-1 text-[12px] text-muted-foreground">
            New requests automatically route to these users when no owner is chosen at creation.
          </p>
        </div>
        <div className="divide-y divide-border">
          {DEPARTMENTS.map((department) => {
            const options = usersByDepartment[department] ?? []
            const currentDefault = defaultByDepartment.get(department)
            const isUpdating =
              defaultMutation.isPending && defaultMutation.variables?.department === department

            return (
              <div key={department} className="grid gap-3 px-5 py-4 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
                <div>
                  <p className="text-[13px] font-semibold text-foreground">{department}</p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    {currentDefault?.user?.name ?? 'No default assignee set'}
                  </p>
                </div>
                <Select
                  value={currentDefault?.userId ?? 'unassigned'}
                  onValueChange={(value) => {
                    if (value === 'unassigned') return
                    defaultMutation.mutate({ department, userId: value })
                  }}
                  disabled={options.length === 0 || isUpdating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={options.length > 0 ? 'Select default assignee' : 'No active users in department'} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )
          })}
        </div>
      </div>

      {usersQuery.isLoading ? (
        <div className="flex min-h-[260px] items-center justify-center">
          <LoadingSpinner className="h-7 w-7" />
        </div>
      ) : usersQuery.isError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-8 text-center">
          <p className="text-sm font-medium text-destructive">Unable to load users</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => void usersQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-16 text-center">
          <Users size={32} className="mx-auto text-muted-foreground/30" />
          <p className="mt-3 text-sm font-semibold text-foreground">No users yet</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm shadow-black/[0.03]">
          <div className="flex items-center gap-4 border-b border-border bg-muted/30 px-5 py-3">
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">User</span>
            </div>
            <div className="hidden w-20 sm:block">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
            </div>
            <div className="hidden w-52 md:block">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Role</span>
            </div>
            <div className="hidden w-28 lg:block">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Joined</span>
            </div>
            <div className="w-28 text-right">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Action</span>
            </div>
          </div>

          <div className="divide-y divide-border">
            {users.map((user) => {
              const isMutating = updateMutation.isPending && updateMutation.variables?.id === user.id

              return (
                <div key={user.id} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/20">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <UserInitials name={user.name} />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-foreground">{user.name}</p>
                      <p className="truncate text-[12px] text-muted-foreground">{user.email}</p>
                      <UserDeptCell userId={user.id} currentDept={user.department} />
                    </div>
                  </div>

                  <div className="hidden w-20 sm:block">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                        user.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500',
                      )}
                    >
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          user.isActive ? 'bg-green-500' : 'bg-slate-400',
                        )}
                      />
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="hidden w-52 md:block">
                    <UserRoleCell userId={user.id} allRoles={allRoles} />
                  </div>

                  <div className="hidden w-28 lg:block">
                    <span className="text-[12px] text-muted-foreground">{formatDate(user.createdAt)}</span>
                  </div>

                  <div className="w-28 text-right">
                    {user.isActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isMutating}
                        className="h-7 px-3 text-xs text-destructive hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive"
                        onClick={() => updateMutation.mutate({ id: user.id, patch: { isActive: false } })}
                      >
                        {isMutating ? <LoadingSpinner className="h-3 w-3" /> : <UserX size={12} />}
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isMutating}
                        className="h-7 px-3 text-xs"
                        onClick={() => updateMutation.mutate({ id: user.id, patch: { isActive: true } })}
                      >
                        {isMutating ? <LoadingSpinner className="h-3 w-3" /> : <UserCheck size={12} />}
                        Activate
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="border-t border-border bg-muted/20 px-5 py-3">
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <Shield size={12} />
              <span>
                {users.length} {users.length === 1 ? 'user' : 'users'} · {activeCount} active
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
