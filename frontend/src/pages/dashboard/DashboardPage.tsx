import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthContext } from '@/context/AuthContext'
import { ClipboardList, AlertCircle, CheckCircle2, Clock, Plus, GitBranch } from 'lucide-react'
import { cn } from '@/lib/utils'
import { workflowsService } from '@/services/workflows.service'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { StartWorkflowDialog } from '@/components/workflows/StartWorkflowDialog'

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

export default function DashboardPage() {
  const { user } = useAuthContext()
  const firstName = user?.name?.split(' ')[0] ?? 'there'
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

  const workflowById = Object.fromEntries(workflows.map((w) => [w.id, w]))

  const openCount = tasks.filter((t) => !t.completedAt).length
  const highPriorityCount = tasks.filter(
    (t) => (t.priority === 'high' || t.priority === 'critical') && !t.completedAt,
  ).length
  const completedCount = tasks.filter((t) => !!t.completedAt).length

  const activeTasks = tasks
    .filter((t) => !t.completedAt)
    .sort(
      (a, b) =>
        (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3) -
        (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3),
    )
    .slice(0, 8)

  const stats = [
    {
      label: 'Open Requests',
      value: tasksQuery.isLoading ? '…' : String(openCount),
      icon: ClipboardList,
      color: 'text-primary',
      bg: 'bg-primary/8',
      loading: tasksQuery.isLoading,
    },
    {
      label: 'High Priority',
      value: tasksQuery.isLoading ? '…' : String(highPriorityCount),
      icon: AlertCircle,
      color: 'text-destructive',
      bg: 'bg-destructive/8',
      loading: tasksQuery.isLoading,
    },
    {
      label: 'Completed',
      value: tasksQuery.isLoading ? '…' : String(completedCount),
      icon: CheckCircle2,
      color: 'text-success',
      bg: 'bg-success/8',
      loading: tasksQuery.isLoading,
    },
  ]

  const availableWorkflows = (workflowsQuery.data ?? []).slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            {getGreeting()}, {firstName}
          </h2>
        </div>
        <span className="hidden rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground sm:inline-flex items-center gap-1.5">
          <Clock size={12} />
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-card p-5 shadow-sm shadow-black/[0.03]"
          >
            <div className="flex items-start justify-between">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', s.bg)}>
                <s.icon size={19} className={s.color} />
              </div>
            </div>
            <div className="mt-4">
              <p className={cn('text-2xl font-bold tabular-nums text-foreground', s.loading && 'opacity-40')}>
                {s.value}
              </p>
              <p className="mt-0.5 text-[13px] font-medium text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Active Requests */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-sm shadow-black/[0.03]">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h3 className="text-sm font-semibold text-foreground">Active Requests</h3>
            <Link to="/tasks" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>

          {tasksQuery.isLoading ? (
            <div className="flex items-center justify-center px-6 py-10">
              <LoadingSpinner />
            </div>
          ) : activeTasks.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
              <ClipboardList size={32} className="text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No active requests —{' '}
                <Link to="/workflows" className="text-primary hover:underline">
                  start one from Workflows
                </Link>
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {activeTasks.map((task) => {
                const currentState = workflowById[task.workflowId]?.states?.find(
                  (s) => s.id === task.currentStateId,
                )
                return (
                  <div key={task.id} className="flex items-center gap-4 px-5 py-3">
                    <div
                      className={cn(
                        'h-8 w-0.5 shrink-0 rounded-full',
                        priorityColor[task.priority] ?? 'bg-muted',
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-foreground truncate">{task.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {workflowById[task.workflowId]?.name ?? '—'}
                      </p>
                    </div>
                    {currentState && (
                      <StatusBadge
                        label={currentState.label}
                        color={currentState.color}
                        className="text-[10px] shrink-0"
                      />
                    )}
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {timeAgo(task.createdAt)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* New Request panel */}
        <div className="rounded-xl border border-border bg-card shadow-sm shadow-black/[0.03]">
          <div className="border-b border-border px-6 py-4">
            <h3 className="text-sm font-semibold text-foreground">New Request</h3>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Log an issue or start a process.
            </p>
          </div>
          <div className="space-y-3 p-4">
            <Button asChild variant="outline" className="w-full justify-start gap-2">
              <Link to="/workflows">
                <GitBranch size={14} />
                Browse Workflows
              </Link>
            </Button>
            <Button
              className="w-full justify-start gap-2"
              onClick={() => setDialogOpen(true)}
            >
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
                      className="block rounded-md px-2 py-1.5 text-[12px] text-foreground hover:bg-accent transition-colors"
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

      <StartWorkflowDialog open={dialogOpen} onOpenChange={setDialogOpen} workflows={workflows} />
    </div>
  )
}
