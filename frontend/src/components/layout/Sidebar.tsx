import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  GitBranch,
  CheckSquare,
  ShieldCheck,
  ScrollText,
  Settings,
  Inbox,
  Layers,
  UserPlus,
  ChevronLeft,
  ChevronDown,
  Route,
  type LucideIcon,
} from 'lucide-react'
import { NectarLogo } from '@/components/brand/NectarLogo'
import { cn } from '@/lib/utils'
import { useAuthContext } from '@/context/AuthContext'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const navItems: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/workflows', label: 'Workflows', icon: GitBranch },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/queue', label: 'Dept Queue', icon: Layers },
  { to: '/approvals', label: 'Approvals', icon: ShieldCheck },
  { to: '/inbox', label: 'Inbox', icon: Inbox },
]

const systemItems: { to: string; label: string; icon: LucideIcon; minRole?: string }[] = [
  { to: '/audit', label: 'Audit Log', icon: ScrollText, minRole: 'Manager' },
  { to: '/dept-defaults', label: 'Dept Routing', icon: Route, minRole: 'Admin' },
  { to: '/access-requests', label: 'Access Requests', icon: UserPlus, minRole: 'Admin' },
  { to: '/admin', label: 'Admin', icon: Settings, minRole: 'Admin' },
]

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [mainOpen, setMainOpen] = useState(true)
  const [systemOpen, setSystemOpen] = useState(true)
  const { user } = useAuthContext()
  const userRoles = user?.roles ?? []
  const isAdmin = userRoles.includes('Admin')
  const isManager = isAdmin || userRoles.includes('Manager')

  function canSee(minRole?: string) {
    if (!minRole) return true
    if (minRole === 'Admin') return isAdmin
    if (minRole === 'Manager') return isManager
    return true
  }

  return (
    <aside
      className={cn(
        'relative flex h-screen flex-col overflow-hidden bg-sidebar transition-all duration-300 ease-in-out before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_22%)]',
        collapsed ? 'w-[68px]' : 'w-[240px]',
      )}
    >
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-sidebar-border px-4',
          collapsed ? 'justify-center' : 'justify-between',
        )}
      >
        {!collapsed && (
          <Link to="/" className="no-underline" style={{ textDecoration: 'none' }}>
            <NectarLogo size="sm" wordmarkClassName="text-white" />
          </Link>
        )}

        {collapsed && (
          <Link to="/" style={{ textDecoration: 'none' }}>
            <NectarLogo size="sm" showWordmark={false} />
          </Link>
        )}

        {!collapsed && (
          <button
            onClick={onToggle}
            className="flex h-7 w-7 items-center justify-center rounded-md text-sidebar-muted-foreground transition-colors hover:bg-sidebar-muted hover:text-sidebar-foreground"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={15} />
          </button>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
        {!collapsed && (
          <button
            onClick={() => setMainOpen((p) => !p)}
            className="mb-1 flex w-full items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted-foreground transition-colors hover:text-sidebar-foreground"
          >
            <span>Main</span>
            <ChevronDown
              size={11}
              className={cn('transition-transform duration-200', mainOpen ? 'rotate-0' : '-rotate-90')}
            />
          </button>
        )}
        {(collapsed || mainOpen) && navItems.map((item) => (
          <SidebarLink key={item.to} collapsed={collapsed} {...item} />
        ))}

        <div className="my-3 border-t border-sidebar-border" />

        {!collapsed && (
          <button
            onClick={() => setSystemOpen((p) => !p)}
            className="mb-1 flex w-full items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted-foreground transition-colors hover:text-sidebar-foreground"
          >
            <span>System</span>
            <ChevronDown
              size={11}
              className={cn('transition-transform duration-200', systemOpen ? 'rotate-0' : '-rotate-90')}
            />
          </button>
        )}
        {(collapsed || systemOpen) && systemItems.filter((item) => canSee(item.minRole)).map((item) => (
          <SidebarLink key={item.to} collapsed={collapsed} {...item} />
        ))}
      </nav>

      {collapsed && (
        <button
          onClick={onToggle}
          className="mx-auto mb-4 flex h-7 w-7 items-center justify-center rounded-md text-sidebar-muted-foreground transition-colors hover:bg-sidebar-muted hover:text-sidebar-foreground"
          aria-label="Expand sidebar"
        >
          <ChevronLeft size={15} className="rotate-180" />
        </button>
      )}
    </aside>
  )
}

function SidebarLink({
  to,
  label,
  icon: Icon,
  collapsed,
}: {
  to: string
  label: string
  icon: LucideIcon
  collapsed: boolean
}) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-all duration-150',
          collapsed && 'justify-center px-0 py-2.5',
          isActive
            ? 'bg-sidebar-active-bg text-sidebar-active-fg'
            : 'text-sidebar-foreground hover:bg-sidebar-muted hover:text-white',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && !collapsed && (
            <span className="absolute left-0 h-6 w-0.5 rounded-r-full bg-sidebar-accent" />
          )}
          <Icon
            size={17}
            className={cn(
              'shrink-0 transition-colors',
              isActive ? 'text-sidebar-accent' : 'text-sidebar-muted-foreground group-hover:text-white',
            )}
          />
          {!collapsed && <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  )
}
