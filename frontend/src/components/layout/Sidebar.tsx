import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import {
  GitBranch,
  CheckSquare,
  ShieldCheck,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const navItems: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/workflows', label: 'Workflows', icon: GitBranch },
  { to: '/tasks', label: 'My Tasks', icon: CheckSquare },
  { to: '/approvals', label: 'Approvals', icon: ShieldCheck },
  { to: '/audit', label: 'Audit Log', icon: ScrollText },
]

const adminItems: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/admin', label: 'Admin', icon: Settings },
]

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [mainOpen, setMainOpen] = useState(true)
  const [systemOpen, setSystemOpen] = useState(true)

  return (
    <aside
      className={cn(
        'relative flex h-screen flex-col bg-sidebar transition-all duration-300 ease-in-out',
        collapsed ? 'w-[68px]' : 'w-[240px]',
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-sidebar-border px-4',
          collapsed ? 'justify-center' : 'justify-between',
        )}
      >
        {!collapsed && (
          <Link
            to="/"
            className="flex items-center gap-2.5 no-underline"
            style={{ textDecoration: 'none' }}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sidebar-accent">
              <span className="text-xs font-bold text-white">N</span>
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-white">
              Nectar
            </span>
          </Link>
        )}
        {collapsed && (
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sidebar-accent">
              <span className="text-xs font-bold text-white">N</span>
            </div>
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

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
        {!collapsed && (
          <button
            onClick={() => setMainOpen((p) => !p)}
            className="mb-1 flex w-full items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted-foreground hover:text-sidebar-foreground transition-colors"
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
            className="mb-1 flex w-full items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted-foreground hover:text-sidebar-foreground transition-colors"
          >
            <span>System</span>
            <ChevronDown
              size={11}
              className={cn('transition-transform duration-200', systemOpen ? 'rotate-0' : '-rotate-90')}
            />
          </button>
        )}
        {(collapsed || systemOpen) && adminItems.map((item) => (
          <SidebarLink key={item.to} collapsed={collapsed} {...item} />
        ))}
      </nav>

      {/* Collapse toggle when collapsed */}
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
          'group flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-all duration-150',
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
