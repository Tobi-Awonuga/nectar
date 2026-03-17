import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ScrollText, ArrowRight, Search } from 'lucide-react'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { auditService, type AuditEvent } from '@/services/audit.service'
import { cn } from '@/lib/utils'

const eventLabels: Record<string, string> = {
  created: 'Request created',
  state_changed: 'State changed',
  assigned: 'Assigned',
  commented: 'Comment added',
  completed: 'Completed',
}

const eventDotColors: Record<string, string> = {
  created: 'bg-primary',
  state_changed: 'bg-green-500',
  assigned: 'bg-amber-500',
  commented: 'bg-muted-foreground',
  completed: 'bg-green-600',
}

const eventLineColors: Record<string, string> = {
  created: 'border-primary/20',
  state_changed: 'border-green-200',
  assigned: 'border-amber-200',
  commented: 'border-border',
  completed: 'border-green-200',
}

function getEventDotColor(eventType: string) {
  return eventDotColors[eventType] ?? 'bg-muted-foreground'
}

function getEventLineColor(eventType: string) {
  return eventLineColors[eventType] ?? 'border-border'
}

function getEventDescription(event: AuditEvent): string {
  if (event.eventType === 'state_changed' && event.fromStateLabel && event.toStateLabel) {
    return `Moved from ${event.fromStateLabel} → ${event.toStateLabel}`
  }
  return eventLabels[event.eventType] ?? event.eventType
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function getDateLabel(iso: string): string {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  const toDay = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  if (toDay(date) === toDay(today)) return 'Today'
  if (toDay(date) === toDay(yesterday)) return 'Yesterday'
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function groupByDate(events: AuditEvent[]): { label: string; events: AuditEvent[] }[] {
  const groups: Map<string, AuditEvent[]> = new Map()
  for (const event of events) {
    const label = getDateLabel(event.createdAt)
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label)!.push(event)
  }
  return Array.from(groups.entries()).map(([label, evts]) => ({ label, events: evts }))
}

export default function AuditLogPage() {
  const [search, setSearch] = useState('')

  const auditQuery = useQuery({
    queryKey: ['audit'],
    queryFn: auditService.getAll,
  })

  const events = auditQuery.data ?? []

  const filtered = useMemo(() => {
    if (!search.trim()) return events
    const q = search.toLowerCase()
    return events.filter(
      (e) =>
        (e.instanceTitle ?? '').toLowerCase().includes(q) ||
        e.eventType.toLowerCase().includes(q) ||
        (eventLabels[e.eventType] ?? '').toLowerCase().includes(q) ||
        (e.performerName ?? '').toLowerCase().includes(q)
    )
  }, [events, search])

  const grouped = useMemo(() => groupByDate(filtered), [filtered])

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Audit Log</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Immutable record of all workflow state changes and actions.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search events, instances, or performers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {/* Content */}
      {auditQuery.isLoading ? (
        <div className="flex min-h-[260px] items-center justify-center">
          <LoadingSpinner className="h-7 w-7" />
        </div>
      ) : auditQuery.isError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-8 text-center">
          <p className="text-sm font-medium text-destructive">Unable to load audit log</p>
          <p className="mt-1 text-xs text-muted-foreground">Check your connection and try again.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => void auditQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-16 text-center shadow-sm shadow-black/[0.03]">
          <ScrollText size={32} className="mx-auto text-muted-foreground/30" />
          <p className="mt-3 text-sm font-semibold text-foreground">
            {search ? 'No matching events' : 'No audit events yet'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {search
              ? 'Try a different search term.'
              : 'Audit events will appear here as workflow actions are taken.'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ label, events: groupEvents }) => (
            <div key={label}>
              {/* Date group header */}
              <div className="mb-4 flex items-center gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </span>
                <div className="flex-1 border-t border-border" />
              </div>

              {/* Timeline */}
              <div className="space-y-0">
                {groupEvents.map((event, idx) => {
                  const isLast = idx === groupEvents.length - 1
                  return (
                    <div key={event.id} className="relative flex gap-4">
                      {/* Timeline track */}
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            'mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-background',
                            getEventDotColor(event.eventType)
                          )}
                        />
                        {!isLast && (
                          <div
                            className={cn(
                              'mt-1 w-0 flex-1 border-l-2',
                              getEventLineColor(event.eventType)
                            )}
                          />
                        )}
                      </div>

                      {/* Event content */}
                      <div className={cn('min-w-0 flex-1 pb-6', isLast && 'pb-0')}>
                        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
                          <div className="min-w-0">
                            {/* Instance title */}
                            {event.instanceTitle && (
                              <p className="text-[13px] font-semibold text-foreground leading-snug truncate">
                                {event.instanceTitle}
                              </p>
                            )}
                            {/* Event description */}
                            <p
                              className={cn(
                                'text-[13px] text-muted-foreground',
                                !event.instanceTitle && 'font-medium text-foreground'
                              )}
                            >
                              {event.eventType === 'state_changed' &&
                              event.fromStateLabel &&
                              event.toStateLabel ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                    {event.fromStateLabel}
                                  </span>
                                  <ArrowRight size={11} className="text-muted-foreground/50 shrink-0" />
                                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                                    {event.toStateLabel}
                                  </span>
                                </span>
                              ) : (
                                getEventDescription(event)
                              )}
                            </p>
                          </div>
                          {/* Timestamp + performer */}
                          <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-muted-foreground sm:pl-4">
                            <span className="font-medium">{event.performerName ?? 'System'}</span>
                            <span>·</span>
                            <span>{formatDate(event.createdAt)}</span>
                          </div>
                        </div>

                        {/* Optional comment */}
                        {event.comment && (
                          <p className="mt-1.5 rounded-lg border border-border bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground italic">
                            "{event.comment}"
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
