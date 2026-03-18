import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, LogOut, Menu, Settings } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthContext } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import { notificationsService } from '@/services/notifications.service'

interface HeaderProps {
  onMenuClick: () => void
}

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/workflows': 'Workflows',
  '/tasks': 'Tasks',
  '/queue': 'Department Queue',
  '/approvals': 'Approvals',
  '/inbox': 'Inbox',
  '/access-requests': 'Access Requests',
  '/audit': 'Audit Log',
  '/admin': 'Admin',
}

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname]
  const base = '/' + pathname.split('/').filter(Boolean)[0]
  return pageTitles[base] ?? 'Nectar'
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuthContext()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsService.getAll,
  })

  const notifData = notificationsQuery.data?.data ?? []
  const unreadCount = notifData.filter((n) => !n.isRead).length
  const notifications = notifData
  const { refetch } = notificationsQuery

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    if (notifOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [notifOpen])

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu size={18} />
        </button>
        <div>
          <h1 className="text-[15px] font-semibold text-foreground">{getPageTitle(pathname)}</h1>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen((p) => !p)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-card" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full z-50 mt-1.5 w-80 rounded-xl border border-border bg-popover shadow-lg shadow-black/5">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-sm font-semibold text-foreground">Notifications</p>
                {unreadCount > 0 && (
                  <button
                    onClick={() => void notificationsService.markAllRead().then(() => refetch())}
                    className="text-xs text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        'flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0',
                        !notif.isRead && 'bg-primary/[0.03]'
                      )}
                    >
                      <div className={cn('mt-1 h-1.5 w-1.5 shrink-0 rounded-full', notif.isRead ? 'bg-transparent' : 'bg-primary')} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-foreground leading-snug">{notif.title}</p>
                        {notif.message && (
                          <p className="mt-0.5 text-[12px] text-muted-foreground line-clamp-2">{notif.message}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <button
          onClick={() => navigate('/admin')}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Settings size={17} />
        </button>

        {/* Divider */}
        <div className="mx-2 h-5 w-px bg-border" />

        {/* User */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen((p) => !p)}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
              {user?.name ? getInitials(user.name) : '?'}
            </span>
            <div className="hidden text-left md:block">
              <p className="max-w-[120px] truncate text-[13px] font-medium text-foreground leading-tight">
                {user?.name?.split(' ')[0]}
              </p>
            </div>
            <ChevronDown
              size={13}
              className={cn(
                'text-muted-foreground transition-transform duration-150',
                dropdownOpen && 'rotate-180',
              )}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full z-50 mt-1.5 w-60 rounded-xl border border-border bg-popover shadow-lg shadow-black/5">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                <p className="truncate text-xs text-muted-foreground mt-0.5">{user?.email}</p>
              </div>
              <div className="p-1.5">
                <button
                  onClick={() => { setDropdownOpen(false); logout() }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-destructive transition-colors hover:bg-destructive/8"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
