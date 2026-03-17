import { useAuthContext } from '@/context/AuthContext'
import {
  GitBranch,
  CheckSquare,
  ShieldCheck,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Circle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const stats = [
  {
    label: 'Active Workflows',
    value: '2',
    change: '+1 this week',
    up: true,
    icon: GitBranch,
    color: 'text-primary',
    bg: 'bg-primary/8',
  },
  {
    label: 'My Tasks',
    value: '0',
    change: 'None assigned',
    up: null,
    icon: CheckSquare,
    color: 'text-success',
    bg: 'bg-success/8',
  },
  {
    label: 'Pending Approvals',
    value: '0',
    change: 'All clear',
    up: null,
    icon: ShieldCheck,
    color: 'text-warning',
    bg: 'bg-warning/8',
  },
  {
    label: 'Completed This Week',
    value: '0',
    change: 'No activity yet',
    up: null,
    icon: TrendingUp,
    color: 'text-destructive',
    bg: 'bg-destructive/8',
  },
]

const recentActivity: { title: string; desc: string; time: string; type: 'created' | 'approved' | 'submitted' | 'system' }[] = [
  { title: 'Purchase Request workflow seeded', desc: 'System — 5 states, 5 transitions', time: 'Today', type: 'system' },
  { title: 'IT Access Request workflow seeded', desc: 'System — 6 states, 6 transitions', time: 'Today', type: 'system' },
]

const activityDot: Record<string, string> = {
  created: 'bg-primary',
  approved: 'bg-success',
  submitted: 'bg-warning',
  system: 'bg-muted-foreground',
}

export default function DashboardPage() {
  const { user } = useAuthContext()
  const firstName = user?.name?.split(' ')[0] ?? 'there'

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
              <p className="text-2xl font-bold tabular-nums text-foreground">{s.value}</p>
              <p className="mt-0.5 text-[13px] font-medium text-muted-foreground">{s.label}</p>
            </div>
            <p
              className={cn(
                'mt-3 text-[12px] font-medium',
                s.up === true && 'text-success',
                s.up === false && 'text-destructive',
                s.up === null && 'text-muted-foreground',
              )}
            >
              {s.change}
            </p>
          </div>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-sm shadow-black/[0.03]">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
            <button className="text-xs font-medium text-primary hover:underline">View all</button>
          </div>
          <div className="divide-y divide-border">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 px-6 py-4">
                <div className="mt-1.5 shrink-0">
                  <Circle size={7} className={cn('fill-current', activityDot[a.type])} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-foreground">{a.title}</p>
                  <p className="text-[12px] text-muted-foreground">{a.desc}</p>
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">{a.time}</span>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                No activity yet. Start by creating a workflow instance.
              </div>
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
              { label: 'New Purchase Request', icon: GitBranch, href: '/workflows' },
              { label: 'New IT Access Request', icon: GitBranch, href: '/workflows' },
              { label: 'View My Tasks', icon: CheckSquare, href: '/tasks' },
              { label: 'Pending Approvals', icon: ShieldCheck, href: '/approvals' },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-foreground transition-colors hover:bg-accent"
              >
                <action.icon size={15} className="text-primary" />
                {action.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
