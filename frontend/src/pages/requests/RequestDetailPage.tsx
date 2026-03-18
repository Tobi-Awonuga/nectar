import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  CircleDot,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Building2,
  Eye,
  ChevronRight,
  AlertCircle,
  User,
  Calendar,
  Flag,
  RotateCcw,
  ArrowLeftRight,
} from 'lucide-react'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { workflowsService } from '@/services/workflows.service'
import { usersService } from '@/services/users.service'
import { cn } from '@/lib/utils'
import type { RequestEvent } from '@/types/domain.types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  if (diffHrs < 48) return `Yesterday at ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) +
    ` at ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
}

function formatKey(key: string) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim()
}

function isDestructiveAction(actionName: string) {
  const l = actionName.toLowerCase()
  return l.includes('reject') || l.includes('cancel') || l.includes('close') || l.includes('decline')
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  critical: { label: 'Critical', color: 'text-red-600' },
  high:     { label: 'High',     color: 'text-orange-500' },
  medium:   { label: 'Medium',   color: 'text-amber-500' },
  low:      { label: 'Low',      color: 'text-slate-400' },
}

// ── Event timeline entry ──────────────────────────────────────────────────────

const eventConfig: Record<string, {
  icon: React.ElementType
  iconClass: string
  dotClass: string
  label: (e: RequestEvent) => string
}> = {
  created: {
    icon: CircleDot,
    iconClass: 'text-primary',
    dotClass: 'bg-primary/15 border-primary/30',
    label: () => 'Request submitted',
  },
  state_changed: {
    icon: ArrowRight,
    iconClass: 'text-primary',
    dotClass: 'bg-primary/10 border-primary/20',
    label: (e) => e.toStateName ? `Moved to ${e.toStateName}` : 'State changed',
  },
  completed: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-600',
    dotClass: 'bg-emerald-50 border-emerald-200',
    label: () => 'Request completed',
  },
  owner_reassigned: {
    icon: UserCheck,
    iconClass: 'text-amber-600',
    dotClass: 'bg-amber-50 border-amber-200',
    label: () => 'Ownership reassigned',
  },
  rejected: {
    icon: XCircle,
    iconClass: 'text-destructive',
    dotClass: 'bg-destructive/5 border-destructive/20',
    label: () => 'Request rejected',
  },
  commented: {
    icon: MessageSquare,
    iconClass: 'text-muted-foreground',
    dotClass: 'bg-muted/50 border-border',
    label: () => 'Note added',
  },
}

function getEventConfig(eventType: string) {
  return eventConfig[eventType] ?? {
    icon: AlertCircle,
    iconClass: 'text-muted-foreground',
    dotClass: 'bg-muted/50 border-border',
    label: () => eventType.replace(/_/g, ' '),
  }
}

function EventEntry({ event, isLast }: { event: RequestEvent; isLast: boolean }) {
  const cfg = getEventConfig(event.eventType)
  const Icon = cfg.icon

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
          cfg.dotClass,
        )}>
          <Icon size={14} className={cfg.iconClass} />
        </div>
        {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
      </div>

      <div className={cn('min-w-0 flex-1', isLast ? 'pb-0' : 'pb-6')}>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[13px] font-semibold text-foreground">{cfg.label(event)}</span>
          <span className="text-[12px] text-muted-foreground">by {event.performedBy.name}</span>
          <span className="ml-auto text-[11px] text-muted-foreground/60">{formatDateTime(event.createdAt)}</span>
        </div>

        {event.eventType === 'state_changed' && event.fromStateName && (
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {event.fromStateName} <span className="mx-1 text-muted-foreground/40">→</span> {event.toStateName}
          </p>
        )}

        {event.eventType === 'owner_reassigned' && (event.fromUserName || event.toUserName) && (
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            <span className={event.fromUserName === 'Unassigned' ? 'italic text-muted-foreground/60' : ''}>
              {event.fromUserName ?? 'Unassigned'}
            </span>
            <span className="mx-1 text-muted-foreground/40">→</span>
            <span className={event.toUserName === 'Unassigned' ? 'italic text-muted-foreground/60' : 'font-medium text-foreground/80'}>
              {event.toUserName ?? 'Unassigned'}
            </span>
          </p>
        )}

        {event.comment && (
          <div className="mt-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-[12px] text-foreground/80 italic">
            "{event.comment}"
          </div>
        )}
      </div>
    </div>
  )
}

// ── Transition button group (shared for forward + backward) ───────────────────

function TransitionButton({
  label,
  actionName,
  isActive,
  isFiring,
  destructive,
  backward,
  note,
  onToggle,
  onNoteChange,
  onCancel,
  onConfirm,
}: {
  label: string
  actionName: string
  isActive: boolean
  isFiring: boolean
  destructive: boolean
  backward: boolean
  note: string
  onToggle: () => void
  onNoteChange: (v: string) => void
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="space-y-2">
      <Button
        size="sm"
        variant={isActive ? 'default' : 'outline'}
        className={cn(
          'w-full justify-start gap-2',
          backward && !isActive && 'border-dashed text-muted-foreground hover:text-foreground hover:bg-muted/50',
          !isActive && destructive && 'text-destructive border-destructive/30 hover:border-destructive/60 hover:bg-destructive/5 hover:text-destructive',
          isActive && destructive && 'bg-destructive hover:bg-destructive/90',
          isActive && backward && !destructive && 'bg-amber-500 hover:bg-amber-500/90 border-transparent text-white',
        )}
        onClick={onToggle}
      >
        {backward
          ? <RotateCcw size={12} className={isActive ? 'text-white' : ''} />
          : <ChevronRight size={13} />
        }
        {label}
      </Button>

      {isActive && (
        <div className="space-y-2 pl-1">
          <Textarea
            placeholder="Add a note (optional)"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            className="min-h-[72px] text-[13px] resize-none"
          />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1" onClick={onCancel} disabled={isFiring}>
              Cancel
            </Button>
            <Button
              size="sm"
              className={cn(
                'flex-1',
                destructive && 'bg-destructive hover:bg-destructive/90',
                backward && !destructive && 'bg-amber-500 hover:bg-amber-500/90',
              )}
              disabled={isFiring}
              onClick={onConfirm}
            >
              {isFiring ? <LoadingSpinner className="h-3 w-3" /> : 'Confirm'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [commentText, setCommentText] = useState('')

  // Transfer ownership state
  const [transferDept, setTransferDept] = useState<string>('')
  const [transferUser, setTransferUser] = useState<string>('')
  const [showTransfer, setShowTransfer] = useState(false)

  const instanceQuery = useQuery({
    queryKey: ['request', id],
    queryFn: () => workflowsService.getInstance(id!),
    enabled: Boolean(id),
  })

  const workflowsQuery = useQuery({
    queryKey: ['workflows'],
    queryFn: workflowsService.getWorkflows,
  })

  const eventsQuery = useQuery({
    queryKey: ['request-events', id],
    queryFn: () => workflowsService.getInstanceEvents(id!),
    enabled: Boolean(id),
  })

  const transferDirQuery = useQuery({
    queryKey: ['transfer-dir', transferDept],
    queryFn: () => usersService.getDirectory({ department: transferDept }),
    enabled: Boolean(transferDept),
  })

  const commentMutation = useMutation({
    mutationFn: (comment: string) => workflowsService.addComment(id!, comment),
    onSuccess: () => {
      setCommentText('')
      void queryClient.invalidateQueries({ queryKey: ['request-events', id] })
    },
  })

  const transitionMutation = useMutation({
    mutationFn: ({ actionName, comment }: { actionName: string; comment?: string }) =>
      workflowsService.transition(id!, actionName, comment),
    onSuccess: () => {
      setPendingAction(null)
      setNote('')
      void queryClient.invalidateQueries({ queryKey: ['request', id] })
      void queryClient.invalidateQueries({ queryKey: ['request-events', id] })
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
      void queryClient.invalidateQueries({ queryKey: ['queue'] })
      void queryClient.invalidateQueries({ queryKey: ['approvals'] })
    },
  })

  const transferMutation = useMutation({
    mutationFn: ({ ownerDepartment, ownerUserId }: { ownerDepartment: string; ownerUserId?: string }) =>
      workflowsService.updateInstance(id!, { ownerDepartment, ownerUserId: ownerUserId || undefined }),
    onSuccess: () => {
      setShowTransfer(false)
      setTransferDept('')
      setTransferUser('')
      void queryClient.invalidateQueries({ queryKey: ['request', id] })
      void queryClient.invalidateQueries({ queryKey: ['request-events', id] })
      void queryClient.invalidateQueries({ queryKey: ['queue'] })
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const isLoading = instanceQuery.isLoading || workflowsQuery.isLoading || eventsQuery.isLoading

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    )
  }

  if (instanceQuery.isError || !instanceQuery.data) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-12 text-center">
        <p className="text-sm font-medium text-destructive">Request not found or could not be loaded.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate(-1)}>Go back</Button>
      </div>
    )
  }

  const instance = instanceQuery.data
  const workflows = workflowsQuery.data ?? []
  const events = eventsQuery.data ?? []
  const workflow = workflows.find((w) => w.id === instance.workflowId)
  const currentState = workflow?.states?.find((s) => s.id === instance.currentStateId)
  const currentPos = currentState?.position ?? 0
  const stateById = Object.fromEntries((workflow?.states ?? []).map((s) => [s.id, s]))

  const availableTransitions = workflow?.transitions?.filter((t) => t.fromStateId === instance.currentStateId) ?? []
  const forwardTransitions = availableTransitions.filter((t) => (stateById[t.toStateId]?.position ?? 999) > currentPos)
  const revertTransitions = availableTransitions.filter((t) => (stateById[t.toStateId]?.position ?? 999) < currentPos)

  const metadata = Object.entries(instance.metadata ?? {})
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].trim().length > 0)
  const priority = priorityConfig[instance.priority] ?? { label: instance.priority, color: 'text-muted-foreground' }
  const watchingDepts = instance.watchingDepartments ?? []

  function handleToggle(actionName: string) {
    if (pendingAction === actionName) {
      setPendingAction(null)
      setNote('')
    } else {
      setPendingAction(actionName)
      setNote('')
    }
  }

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      {/* Header card */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {currentState && (
            <StatusBadge label={currentState.label} color={currentState.color} className="text-[11px]" />
          )}
          <span className={cn('text-[11px] font-semibold uppercase tracking-wide', priority.color)}>
            <Flag size={10} className="mr-1 inline-block" />
            {priority.label}
          </span>
          {instance.completedAt && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
              Completed
            </span>
          )}
        </div>

        <h1 className="text-2xl font-semibold text-foreground">{instance.title}</h1>

        {instance.description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {instance.description}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-muted-foreground">
          <span className="font-medium text-foreground/70">{workflow?.name ?? 'Unknown workflow'}</span>

          {instance.submittedByUser && (
            <span className="flex items-center gap-1">
              <User size={11} />
              Submitted by <span className="ml-1 font-medium text-foreground/80">{instance.submittedByUser.name}</span>
            </span>
          )}

          {instance.ownerDepartment && (
            <span className="flex items-center gap-1">
              <Building2 size={11} />
              {instance.ownerDepartment}
            </span>
          )}

          {instance.ownerUser?.name && (
            <span className="flex items-center gap-1">
              <UserCheck size={11} />
              Owner: <span className="ml-1 font-medium text-foreground/80">{instance.ownerUser.name}</span>
            </span>
          )}

          {watchingDepts.length > 0 && (
            <span className="flex items-center gap-1">
              <Eye size={11} />
              Watching: {watchingDepts.join(', ')}
            </span>
          )}

          <span className="flex items-center gap-1">
            <Calendar size={11} />
            Opened {formatDate(instance.createdAt)}
          </span>

          {instance.completedAt && (
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 size={11} />
              Completed {formatDate(instance.completedAt)}
            </span>
          )}
        </div>
      </section>

      {/* Body — two column */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">

        {/* Left: Activity */}
        <div className="rounded-xl border border-border bg-card shadow-sm shadow-black/[0.03] flex flex-col overflow-hidden">
          {/* Section header */}
          <div className="px-6 pt-5 pb-4 border-b border-border shrink-0">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Activity
              {events.length > 0 && (
                <span className="ml-2 font-normal normal-case tracking-normal text-muted-foreground/60">
                  · {events.length} {events.length === 1 ? 'event' : 'events'}
                </span>
              )}
            </h2>
          </div>

          {/* Scrollable event list — capped so the Add Note box stays in view */}
          <div className="overflow-y-auto max-h-[460px] px-6 py-5">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <div>
                {events.map((event, i) => (
                  <EventEntry key={event.id} event={event} isLast={i === events.length - 1} />
                ))}
              </div>
            )}
          </div>

          {/* Add note — always visible, outside the scroll region */}
          <div className="border-t border-border px-6 py-4 space-y-2 shrink-0">
            <Textarea
              placeholder="Leave a note..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[72px] text-[13px] resize-none"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                disabled={!commentText.trim() || commentMutation.isPending}
                onClick={() => commentMutation.mutate(commentText.trim())}
              >
                {commentMutation.isPending ? <LoadingSpinner className="h-3 w-3 mr-1.5" /> : <MessageSquare size={13} className="mr-1.5" />}
                Add Note
              </Button>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">

          {/* Forward actions */}
          {forwardTransitions.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm shadow-black/[0.03]">
              <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </h2>
              <div className="space-y-2">
                {forwardTransitions.map((t) => (
                  <TransitionButton
                    key={t.id}
                    label={t.actionLabel}
                    actionName={t.actionName}
                    isActive={pendingAction === t.actionName}
                    isFiring={transitionMutation.isPending && pendingAction === t.actionName}
                    destructive={isDestructiveAction(t.actionName)}
                    backward={false}
                    note={note}
                    onToggle={() => handleToggle(t.actionName)}
                    onNoteChange={setNote}
                    onCancel={() => { setPendingAction(null); setNote('') }}
                    onConfirm={() => transitionMutation.mutate({ actionName: t.actionName, comment: note.trim() || undefined })}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Revert actions */}
          {revertTransitions.length > 0 && (
            <div className="rounded-xl border border-dashed border-border bg-card p-4 shadow-sm shadow-black/[0.03]">
              <h2 className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <RotateCcw size={11} />
                Step Back
              </h2>
              <div className="space-y-2">
                {revertTransitions.map((t) => (
                  <TransitionButton
                    key={t.id}
                    label={t.actionLabel}
                    actionName={t.actionName}
                    isActive={pendingAction === t.actionName}
                    isFiring={transitionMutation.isPending && pendingAction === t.actionName}
                    destructive={isDestructiveAction(t.actionName)}
                    backward={true}
                    note={note}
                    onToggle={() => handleToggle(t.actionName)}
                    onNoteChange={setNote}
                    onCancel={() => { setPendingAction(null); setNote('') }}
                    onConfirm={() => transitionMutation.mutate({ actionName: t.actionName, comment: note.trim() || undefined })}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Transfer Ownership */}
          {watchingDepts.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm shadow-black/[0.03]">
              <h2 className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <ArrowLeftRight size={11} />
                Transfer Ownership
              </h2>

              {!showTransfer ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start gap-2 text-muted-foreground"
                  onClick={() => setShowTransfer(true)}
                >
                  <ArrowLeftRight size={13} />
                  Hand off to watcher dept
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">New Owner Dept</p>
                    <Select value={transferDept} onValueChange={(v) => { setTransferDept(v); setTransferUser('') }}>
                      <SelectTrigger className="h-8 text-[13px]">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {watchingDepts.map((dept) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {transferDept && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">Assign to (optional)</p>
                      <Select value={transferUser} onValueChange={setTransferUser}>
                        <SelectTrigger className="h-8 text-[13px]">
                          <SelectValue placeholder="Anyone in dept" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Anyone in dept</SelectItem>
                          {(transferDirQuery.data ?? []).map((u) => (
                            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => { setShowTransfer(false); setTransferDept(''); setTransferUser('') }}
                      disabled={transferMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={!transferDept || transferMutation.isPending}
                      onClick={() => transferMutation.mutate({
                        ownerDepartment: transferDept,
                        ownerUserId: transferUser && transferUser !== 'unassigned' ? transferUser : undefined,
                      })}
                    >
                      {transferMutation.isPending ? <LoadingSpinner className="h-3 w-3" /> : 'Transfer'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Details */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm shadow-black/[0.03]">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Details
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">Status</dt>
                <dd className="mt-0.5">
                  {currentState
                    ? <StatusBadge label={currentState.label} color={currentState.color} className="text-[11px]" />
                    : <span className="text-[13px] text-muted-foreground">—</span>
                  }
                </dd>
              </div>

              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">Submitted by</dt>
                <dd className="mt-0.5 text-[13px] text-foreground">
                  {instance.submittedByUser?.name ?? '—'}
                </dd>
              </div>

              {instance.ownerUser && (
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">Owner</dt>
                  <dd className="mt-0.5 text-[13px] text-foreground">{instance.ownerUser.name}</dd>
                </div>
              )}

              {instance.ownerDepartment && (
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">Department</dt>
                  <dd className="mt-0.5 text-[13px] text-foreground">{instance.ownerDepartment}</dd>
                </div>
              )}

              {metadata.map(([key, value]) => (
                <div key={key}>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
                    {formatKey(key)}
                  </dt>
                  <dd className="mt-0.5 text-[13px] text-foreground">{value}</dd>
                </div>
              ))}

              {instance.dueDate && (
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">Due</dt>
                  <dd className="mt-0.5 text-[13px] text-foreground">{formatDate(instance.dueDate)}</dd>
                </div>
              )}

              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">Opened</dt>
                <dd className="mt-0.5 text-[13px] text-foreground">{formatDate(instance.createdAt)}</dd>
              </div>

              {instance.completedAt && (
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">Completed</dt>
                  <dd className="mt-0.5 text-[13px] text-emerald-600">{formatDate(instance.completedAt)}</dd>
                </div>
              )}
            </dl>
          </div>

        </div>
      </div>
    </div>
  )
}
