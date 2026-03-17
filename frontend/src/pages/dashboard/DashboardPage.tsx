import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthContext } from '@/context/AuthContext'
import {
  GitBranch,
  ClipboardList,
  Activity,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Circle,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { workflowsService } from '@/services/workflows.service'
import { Badge } from '@/components/ui/badge'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  const { user } = useAuthContext()
  const firstName = user?.name?.split(' ')[0] ?? 'there'

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

  const workflowCount = workflows.length
  const requestCount = tasks.length
  const inProgressCount = tasks.filter((t) => !t.completedAt).length
  const completedCount = tasks.filter((t) => t.completedAt != null).length

  const workflowById = Object.fromEntries(workflows.map((w) => [w.id, w]))

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const stats = [
    {
      label: 'Workflow Templates',
      value: workflowsQuery.isLoading ? '…' : String(workflowCount),
      icon: GitBranch,
      color: 'text-primary',
      bg: 'bg-primary/8',
      loading: workflowsQuery.isLoading,
    },
    {
      label: 'My Requests',
      value: tasksQuery.isLoading ? '…' : String(requestCount),
      icon: ClipboardList,
      color: 'text-primary',
      bg: 'bg-primary/8',
      loading: tasksQuery.isLoading,
    },
    {
      label: 'In Progress',
      value: tasksQuery.isLoading ? '…' : String(inProgressCount),
      icon: Activity,
      color: 'text-warning',
      bg: 'bg-warning/8',
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

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            {getGreeting()}, {firstName}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's what's happening in your workspace today.
          </p>
        </div>
        <span className="hidden rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground sm:inline-flex items-center gap-1.5">
          <Clock size={12} />
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="group rounded-xl border border-border bg-card p-5 shadow-sm shadow-black/[0.03] transition-shadow hover:shadow-md hover:shadow-black/[0.06]"
          >
            <div className="flex items-start justify-between">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', s.bg)}>
                <s.icon size={19} className={s.color} />
              </div>
              <ArrowUpRight
                size={15}
                className="text-muted-foreground/40 transition-colors group-hover:text-muted-foreground"
              />
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

      {/* Content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-sm shadow-black/[0.03]">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
            <Link to="/tasks" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {tasksQuery.isLoading ? (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">Loading activity…</div>
            ) : recentTasks.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                No activity yet — start by creating a request.
              </div>
            ) : (
              recentTasks.map((task) => {
                const workflowName = workflowById[task.workflowId]?.name ?? 'Workflow'
                const dateStr = new Date(task.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                })
                return (
                  <div key={task.id} className="flex items-start gap-3 px-6 py-4">
                    <div className="mt-1.5 shrink-0">
                      <Circle size={7} className="fill-current text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-foreground">{task.title}</p>
                      <p className="text-[12px] text-muted-foreground">{workflowName}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0">
                        Created
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">{dateStr}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-border bg-card shadow-sm shadow-black/[0.03]">
          <div className="border-b border-border px-6 py-4">
            <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
          </div>
          <div className="space-y-2 p-4">
            {[
              { label: 'Browse Workflows', icon: GitBranch, href: '/workflows' },
              { label: 'View My Requests', icon: ClipboardList, href: '/tasks' },
              { label: 'Pending Approvals', icon: ShieldCheck, href: '/approvals' },
              { label: 'In Progress Work', icon: Activity, href: '/tasks' },
            ].map((action) => (
              <Link
                key={action.label}
                to={action.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-foreground transition-colors hover:bg-accent"
              >
                <action.icon size={15} className="text-primary" />
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
