import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthContext } from '@/context/AuthContext'
import {
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  GitBranch,
  ShieldCheck,
  Layers,
  Users,
  UserPlus,
  ArrowUpRight,
  Route,
  RotateCcw,
  UserX,
  Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { workflowsService } from '@/services/workflows.service'
import { approvalsService } from '@/services/approvals.service'
import { onboardingService } from '@/services/onboarding.service'
import { adminService } from '@/services/admin.service'
import { workflowDepartments } from '@/config/workflowBlueprints'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { StartWorkflowDialog } from '@/components/workflows/StartWorkflowDialog'
import type { User, WorkflowInstance, Workflow } from '@/types/domain.types'
import type { PendingApproval } from '@/services/approvals.service'

// ── Shared utilities ──────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
const priorityColor: Record<string, string> = {
  critical: 'bg-destructive',
  high: 'bg-warning',
  medium: 'bg-primary/40',
  low: 'bg-muted-foreground/30',
}

function sortByPriority(a: WorkflowInstance, b: WorkflowInstance) {
  return (
    (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3) -
    (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3)
  )
}

// ── Shared components ─────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  loading,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
  bg: string
  loading?: boolean
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm shadow-black/[0.03]">
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', bg)}>
        <Icon size={19} className={color} />
      </div>
      <div className="mt-4">
        <p className={cn('text-2xl font-bold tabular-nums text-foreground', loading && 'opacity-40')}>
          {loading ? '…' : value}
        </p>
        <p className="mt-0.5 text-[13px] font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

function SectionCard({
  title,
  linkTo,
  linkLabel,
  children,
  className,
}: {
  title: string
  linkTo?: string
  linkLabel?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-xl border border-border bg-card shadow-sm shadow-black/[0.03]', className)}>
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {linkTo && (
          <Link to={linkTo} className="text-xs font-medium text-primary hover:underline">
            {linkLabel ?? 'View all'}
          </Link>
        )}
      </div>
      {children}
    </div>
  )
}

function TaskRow({
  task,
  workflows,
}: {
  task: WorkflowInstance
  workflows: Workflow[]
}) {
  const workflow = workflows.find((w) => w.id === task.workflowId)
  const currentState = workflow?.states?.find((s) => s.id === task.currentStateId)
  return (
    <Link
      to={`/requests/${task.id}`}
      className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/30 no-underline"
    >
      <div className={cn('h-8 w-0.5 shrink-0 rounded-full', priorityColor[task.priority] ?? 'bg-muted')} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-foreground truncate">{task.title}</p>
        <p className="text-[11px] text-muted-foreground">{workflow?.name ?? '—'}</p>
      </div>
      {currentState && (
        <StatusBadge label={currentState.label} color={currentState.color} className="text-[10px] shrink-0" />
      )}
      <span className="text-[11px] text-muted-foreground shrink-0">{timeAgo(task.createdAt)}</span>
    </Link>
  )
}

function EmptySection({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <Icon size={28} className="text-muted-foreground/30" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

// ── Page header (shared across all roles) ─────────────────────────────────────

function DashboardHeader({ firstName }: { firstName: string }) {
  return (
    <div className="flex items-start justify-between">
      <h2 className="text-2xl font-semibold text-foreground">
        {getGreeting()}, {firstName}
      </h2>
      <span className="hidden rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground sm:inline-flex items-center gap-1.5">
        <Clock size={12} />
        {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
      </span>
    </div>
  )
}

// ── Employee Dashboard ────────────────────────────────────────────────────────

function EmployeeDashboard({ user }: { user: User }) {
  const firstName = user.name?.split(' ')[0] ?? 'there'
  const [dialogOpen, setDialogOpen] = useState(false)

  const workflowsQuery = useQuery({
    queryKey: ['workflows'],
    queryFn: workflowsService.getWorkflows,
  })

  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: () => workflowsService.getInstances(),
  })

  const workflows = workflowsQuery.data ?? []
  const tasks = tasksQuery.data ?? []
  const loading = tasksQuery.isLoading

  const openTasks = tasks.filter((t) => !t.completedAt)
  const myOpen = openTasks.filter((t) => t.createdBy === user.id)
  const assignedToMe = openTasks.filter((t) => t.ownerUserId === user.id)
  const waitingOnOthers = openTasks.filter(
    (t) => t.createdBy === user.id && t.ownerUserId && t.ownerUserId !== user.id,
  )

  const myActiveWork = assignedToMe.sort(sortByPriority).slice(0, 8)
  const watching = openTasks
    .filter(
      (t) =>
        t.createdBy !== user.id &&
        t.ownerUserId !== user.id &&
        user.department &&
        t.watchingDepartments.includes(user.department),
    )
    .slice(0, 5)

  const availableWorkflows = workflows.slice(0, 5)

  return (
    <div className="space-y-8">
      <DashboardHeader firstName={firstName} />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="My Open Requests" value={myOpen.length} icon={ClipboardList} color="text-primary" bg="bg-primary/8" loading={loading} />
        <StatCard label="Assigned To Me" value={assignedToMe.length} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-600/8" loading={loading} />
        <StatCard label="Waiting On Others" value={waitingOnOthers.length} icon={Clock} color="text-amber-500" bg="bg-amber-500/8" loading={loading} />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* My Active Work */}
        <SectionCard title="My Active Work" linkTo="/tasks" className="lg:col-span-2">
          {loading ? (
            <div className="flex items-center justify-center px-6 py-10">
              <LoadingSpinner />
            </div>
          ) : myActiveWork.length === 0 ? (
            <EmptySection icon={ClipboardList} message="No tasks assigned to you right now." />
          ) : (
            <div className="divide-y divide-border">
              {myActiveWork.map((task) => (
                <TaskRow key={task.id} task={task} workflows={workflows} />
              ))}
            </div>
          )}
        </SectionCard>

        {/* Start a Request */}
        <div className="rounded-xl border border-border bg-card shadow-sm shadow-black/[0.03]">
          <div className="border-b border-border px-6 py-4">
            <h3 className="text-sm font-semibold text-foreground">Start a Request</h3>
            <p className="mt-0.5 text-[12px] text-muted-foreground">Log an issue or start a process.</p>
          </div>
          <div className="space-y-3 p-4">
            <Button asChild variant="outline" className="w-full justify-start gap-2">
              <Link to="/workflows">
                <GitBranch size={14} />
                Browse Workflows
              </Link>
            </Button>
            <Button className="w-full justify-start gap-2" onClick={() => setDialogOpen(true)}>
              <Plus size={14} />
              Start Request
            </Button>
            {availableWorkflows.length > 0 && (
              <div className="pt-2">
                <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Available
                </p>
                <div className="space-y-0.5">
                  {availableWorkflows.map((wf) => (
                    <Link
                      key={wf.id}
                      to="/workflows"
                      className="block rounded-md px-2 py-1.5 text-[12px] text-foreground hover:bg-accent transition-colors no-underline"
                    >
                      {wf.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Watching */}
      {watching.length > 0 && (
        <SectionCard title="Watching" linkTo="/tasks">
          <div className="divide-y divide-border">
            {watching.map((task) => (
              <TaskRow key={task.id} task={task} workflows={workflows} />
            ))}
          </div>
        </SectionCard>
      )}

      <StartWorkflowDialog open={dialogOpen} onOpenChange={setDialogOpen} workflows={workflows} />
    </div>
  )
}

// ── Manager Dashboard ─────────────────────────────────────────────────────────

function ManagerDashboard({ user }: { user: User }) {
  const firstName = user.name?.split(' ')[0] ?? 'there'

  const workflowsQuery = useQuery({
    queryKey: ['workflows'],
    queryFn: workflowsService.getWorkflows,
  })

  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: () => workflowsService.getInstances(),
  })

  const approvalsQuery = useQuery({
    queryKey: ['approvals'],
    queryFn: approvalsService.getPending,
  })

  const queueQuery = useQuery({
    queryKey: ['queue'],
    queryFn: workflowsService.getDepartmentQueue,
  })

  const workflows = workflowsQuery.data ?? []
  const tasks = tasksQuery.data ?? []
  const approvals = approvalsQuery.data ?? []
  const queueData = queueQuery.data ?? { department: null, instances: [] }
  const loading = tasksQuery.isLoading

  const openTasks = tasks.filter((t) => !t.completedAt)
  const highPriority = openTasks.filter((t) => t.priority === 'high' || t.priority === 'critical')

  // Aging = open for more than 7 days
  const sevenDaysAgo = Date.now() - 7 * 86400000
  const aging = openTasks.filter((t) => new Date(t.createdAt).getTime() < sevenDaysAgo)

  // Workload by owner
  const workloadMap = new Map<string, { name: string; count: number }>()
  for (const t of queueData.instances) {
    if (t.ownerUser?.name) {
      const existing = workloadMap.get(t.ownerUserId ?? '')
      if (existing) {
        existing.count++
      } else {
        workloadMap.set(t.ownerUserId ?? '', { name: t.ownerUser.name, count: 1 })
      }
    }
  }
  const workload = [...workloadMap.values()].sort((a, b) => b.count - a.count).slice(0, 8)
  const maxWorkload = workload.length > 0 ? workload[0].count : 1

  // Top approvals
  const topApprovals = approvals.slice(0, 5)

  // Exceptions: unassigned in queue
  const unassigned = queueData.instances.filter((t) => !t.ownerUserId && !t.completedAt)

  return (
    <div className="space-y-8">
      <DashboardHeader firstName={firstName} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Department Queue" value={queueData.instances.length} icon={Layers} color="text-primary" bg="bg-primary/8" loading={queueQuery.isLoading} />
        <StatCard label="Pending Approvals" value={approvals.length} icon={ShieldCheck} color="text-violet-600" bg="bg-violet-600/8" loading={approvalsQuery.isLoading} />
        <StatCard label="High Priority" value={highPriority.length} icon={AlertCircle} color="text-destructive" bg="bg-destructive/8" loading={loading} />
        <StatCard label="Aging (7d+)" value={aging.length} icon={Clock} color="text-amber-500" bg="bg-amber-500/8" loading={loading} />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Needs My Approval */}
        <SectionCard title="Needs My Approval" linkTo="/approvals" className="lg:col-span-2">
          {approvalsQuery.isLoading ? (
            <div className="flex items-center justify-center px-6 py-10"><LoadingSpinner /></div>
          ) : topApprovals.length === 0 ? (
            <EmptySection icon={ShieldCheck} message="No approvals pending — you're all caught up." />
          ) : (
            <div className="divide-y divide-border">
              {topApprovals.map((item) => (
                <ApprovalRow key={item.id} item={item} workflows={workflows} />
              ))}
            </div>
          )}
        </SectionCard>

        {/* Quick Actions */}
        <div className="rounded-xl border border-border bg-card shadow-sm shadow-black/[0.03]">
          <div className="border-b border-border px-6 py-4">
            <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
          </div>
          <div className="space-y-2 p-4">
            <Button asChild variant="outline" className="w-full justify-start gap-2">
              <Link to="/queue">
                <Layers size={14} />
                Open Queue
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start gap-2">
              <Link to="/approvals">
                <ShieldCheck size={14} />
                Review Approvals
                {approvals.length > 0 && (
                  <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                    {approvals.length}
                  </span>
                )}
              </Link>
            </Button>
            {unassigned.length > 0 && (
              <Button asChild variant="outline" className="w-full justify-start gap-2 border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800">
                <Link to="/queue">
                  <UserX size={14} />
                  {unassigned.length} Unassigned
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Workload by owner */}
      {workload.length > 0 && (
        <SectionCard title="Workload by Owner" linkTo="/queue" linkLabel="Open Queue">
          <div className="px-6 py-5 space-y-3">
            {workload.map((entry) => (
              <div key={entry.name} className="flex items-center gap-3">
                <span className="w-28 truncate text-[13px] font-medium text-foreground shrink-0">{entry.name}</span>
                <div className="flex-1 h-5 rounded-md bg-muted/50 overflow-hidden">
                  <div
                    className="h-full rounded-md bg-primary/20"
                    style={{ width: `${Math.max((entry.count / maxWorkload) * 100, 8)}%` }}
                  />
                </div>
                <span className="text-[13px] font-bold tabular-nums text-foreground w-6 text-right">{entry.count}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  )
}

function ApprovalRow({ item, workflows }: { item: PendingApproval; workflows: Workflow[] }) {
  const workflow = workflows.find((w) => w.id === item.workflowId)
  return (
    <Link
      to={`/requests/${item.id}`}
      className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/30 no-underline"
    >
      <div className={cn('h-8 w-0.5 shrink-0 rounded-full', priorityColor[item.priority] ?? 'bg-muted')} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-foreground truncate">{item.title}</p>
        <p className="text-[11px] text-muted-foreground">
          {workflow?.name ?? '—'}
          {item.createdByUser?.name && <> · by {item.createdByUser.name}</>}
        </p>
      </div>
      {item.currentState && (
        <StatusBadge label={item.currentState.label} color={item.currentState.color ?? 'slate'} className="text-[10px] shrink-0" />
      )}
      <ArrowUpRight size={14} className="shrink-0 text-muted-foreground/40" />
    </Link>
  )
}

// ── Admin Dashboard ───────────────────────────────────────────────────────────

const ALL_DEPARTMENTS = workflowDepartments.filter((d) => d !== 'All Departments')

function AdminDashboard({ user }: { user: User }) {
  const firstName = user.name?.split(' ')[0] ?? 'there'

  const workflowsQuery = useQuery({
    queryKey: ['workflows'],
    queryFn: workflowsService.getWorkflows,
  })

  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: () => workflowsService.getInstances(),
  })

  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: adminService.getUsers,
  })

  const pendingQuery = useQuery({
    queryKey: ['pending-onboarding'],
    queryFn: onboardingService.getPending,
  })

  const defaultsQuery = useQuery({
    queryKey: ['department-defaults'],
    queryFn: adminService.getDepartmentDefaults,
  })

  const approvalsQuery = useQuery({
    queryKey: ['approvals'],
    queryFn: approvalsService.getPending,
  })

  const workflows = workflowsQuery.data ?? []
  const tasks = tasksQuery.data ?? []
  const allUsers = usersQuery.data ?? []
  const pendingUsers = pendingQuery.data ?? []
  const defaults = defaultsQuery.data ?? []
  const approvals = approvalsQuery.data ?? []
  const loading = tasksQuery.isLoading

  const activeUsers = allUsers.filter((u) => u.isActive)
  const openTasks = tasks.filter((t) => !t.completedAt)
  const unownedRequests = openTasks.filter((t) => !t.ownerUserId)

  // Departments missing defaults
  const deptWithDefaults = new Set(defaults.map((d) => d.department))
  const missingDefaults = ALL_DEPARTMENTS.filter((d) => !deptWithDefaults.has(d))

  // Requests by department
  const byDept = new Map<string, number>()
  for (const t of openTasks) {
    const dept = t.ownerDepartment ?? 'Unassigned'
    byDept.set(dept, (byDept.get(dept) ?? 0) + 1)
  }
  const deptBreakdown = [...byDept.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  const maxDept = deptBreakdown.length > 0 ? deptBreakdown[0][1] : 1

  return (
    <div className="space-y-8">
      <DashboardHeader firstName={firstName} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Pending Access" value={pendingUsers.length} icon={UserPlus} color="text-amber-600" bg="bg-amber-600/8" loading={pendingQuery.isLoading} />
        <StatCard label="Active Users" value={activeUsers.length} icon={Users} color="text-primary" bg="bg-primary/8" loading={usersQuery.isLoading} />
        <StatCard label="Unowned Requests" value={unownedRequests.length} icon={UserX} color="text-destructive" bg="bg-destructive/8" loading={loading} />
        <StatCard label="Missing Defaults" value={missingDefaults.length} icon={Route} color="text-amber-500" bg="bg-amber-500/8" loading={defaultsQuery.isLoading} />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Access & Onboarding */}
        <SectionCard title="Access & Onboarding" linkTo="/access-requests" className="lg:col-span-2">
          {pendingQuery.isLoading ? (
            <div className="flex items-center justify-center px-6 py-10"><LoadingSpinner /></div>
          ) : pendingUsers.length === 0 ? (
            <EmptySection icon={UserPlus} message="No pending access requests." />
          ) : (
            <div className="divide-y divide-border">
              {pendingUsers.slice(0, 5).map((entry) => (
                <div key={entry.requestId} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                    {entry.user.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-foreground truncate">{entry.user.name}</p>
                    <p className="text-[11px] text-muted-foreground">{entry.user.email}</p>
                  </div>
                  {entry.user.department && (
                    <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground shrink-0">
                      {entry.user.department}
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground shrink-0">{timeAgo(entry.requestedAt)}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Quick Actions */}
        <div className="rounded-xl border border-border bg-card shadow-sm shadow-black/[0.03]">
          <div className="border-b border-border px-6 py-4">
            <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
          </div>
          <div className="space-y-2 p-4">
            <Button asChild variant="outline" className="w-full justify-start gap-2">
              <Link to="/access-requests">
                <UserPlus size={14} />
                Review Access Requests
                {pendingUsers.length > 0 && (
                  <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                    {pendingUsers.length}
                  </span>
                )}
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start gap-2">
              <Link to="/dept-defaults">
                <Route size={14} />
                Manage Dept Routing
                {missingDefaults.length > 0 && (
                  <span className="ml-auto text-[11px] text-amber-500 font-medium">
                    {missingDefaults.length} missing
                  </span>
                )}
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start gap-2">
              <Link to="/approvals">
                <ShieldCheck size={14} />
                Review Approvals
                {approvals.length > 0 && (
                  <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                    {approvals.length}
                  </span>
                )}
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start gap-2">
              <Link to="/admin">
                <Users size={14} />
                Open Admin
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Routing Health + Platform Oversight */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Routing Health */}
        <SectionCard title="Routing Health" linkTo="/dept-defaults" linkLabel="Manage">
          {missingDefaults.length === 0 && unownedRequests.length === 0 ? (
            <EmptySection icon={CheckCircle2} message="All departments have defaults and all requests have owners." />
          ) : (
            <div className="px-6 py-5 space-y-4">
              {missingDefaults.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Departments without default assignee
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {missingDefaults.map((d) => (
                      <span key={d} className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-[12px] font-medium text-amber-700">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {unownedRequests.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Requests without owner ({unownedRequests.length})
                  </p>
                  <div className="space-y-1">
                    {unownedRequests.slice(0, 4).map((t) => (
                      <Link
                        key={t.id}
                        to={`/requests/${t.id}`}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-foreground hover:bg-muted/50 transition-colors no-underline"
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full', priorityColor[t.priority] ?? 'bg-muted')} />
                        <span className="truncate">{t.title}</span>
                        <span className="ml-auto text-[11px] text-muted-foreground shrink-0">{timeAgo(t.createdAt)}</span>
                      </Link>
                    ))}
                    {unownedRequests.length > 4 && (
                      <Link to="/tasks" className="block px-2 py-1 text-[12px] text-primary hover:underline no-underline">
                        +{unownedRequests.length - 4} more
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* Platform Overview — by department */}
        <SectionCard title="Open Requests by Department">
          {deptBreakdown.length === 0 ? (
            <EmptySection icon={Layers} message="No open requests." />
          ) : (
            <div className="px-6 py-5 space-y-3">
              {deptBreakdown.map(([dept, count]) => (
                <div key={dept} className="flex items-center gap-3">
                  <span className="w-32 truncate text-[13px] font-medium text-foreground shrink-0">{dept}</span>
                  <div className="flex-1 h-5 rounded-md bg-muted/50 overflow-hidden">
                    <div
                      className="h-full rounded-md bg-primary/20"
                      style={{ width: `${Math.max((count / maxDept) * 100, 8)}%` }}
                    />
                  </div>
                  <span className="text-[13px] font-bold tabular-nums text-foreground w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}

// ── Entry point ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuthContext()

  if (!user) {
    return (
      <div className="flex min-h-[260px] items-center justify-center">
        <LoadingSpinner className="h-7 w-7" />
      </div>
    )
  }

  const roles = user.roles ?? []

  if (roles.includes('Admin')) return <AdminDashboard user={user} />
  if (roles.includes('Manager')) return <ManagerDashboard user={user} />
  return <EmployeeDashboard user={user} />
}
